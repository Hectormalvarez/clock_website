import { playBeep } from '@/shared/audio/beep';
import { flipAnimate } from '@/shared/dom/flip';
import { queryOptional } from '@/shared/dom/query';
import {
	addAlarm,
	alarmDisplayName,
	createAlarmCore,
	dismissAlarm,
	formatAlarmTime,
	parseAlarmTime,
	removeAlarm,
	setAlarmEnabled,
	snoozeAlarm,
	tickAlarms,
} from './alarm.core';
import type { AlarmCore } from './alarm.core';
import { loadAlarms, saveAlarms } from './alarm.storage';

/** Handle returned by {@link initAlarm} for driving alarms from outside. */
export interface AlarmInstance {
	togglePanel: () => void;
	getState: () => AlarmCore;
	destroy: () => void;
}

export interface AlarmConfig {
	storageKey?: string;
}

export function initAlarm(
	rootElement: HTMLElement,
	config: AlarmConfig = {},
): AlarmInstance | undefined {
	// ---------- DOM lookups (with type narrowing guard) ----------

	const toggleBtn = queryOptional<HTMLButtonElement>(
		rootElement,
		'.alarm-toggle',
	);
	const panel = queryOptional<HTMLElement>(rootElement, '.alarm-panel');
	const nameInput = queryOptional<HTMLInputElement>(rootElement, '.alarm-name');
	const timeInput = queryOptional<HTMLInputElement>(rootElement, '.alarm-time');
	const addBtn = queryOptional<HTMLButtonElement>(rootElement, '.alarm-add');
	const repeatInput = queryOptional<HTMLInputElement>(
		rootElement,
		'.alarm-repeat',
	);
	const errorEl = queryOptional<HTMLElement>(rootElement, '.alarm-error');
	const list = queryOptional<HTMLElement>(rootElement, '.alarm-list');

	const overlay = queryOptional<HTMLElement>(document, '.alarm-overlay');
	const overlayCard = queryOptional<HTMLElement>(
		document,
		'.alarm-overlay-card',
	);
	const overlayName = queryOptional<HTMLElement>(
		document,
		'.alarm-overlay-name',
	);
	const overlayTime = queryOptional<HTMLElement>(
		document,
		'.alarm-overlay-time',
	);
	const snoozeBtn = queryOptional<HTMLButtonElement>(document, '.alarm-snooze');
	const dismissBtn = queryOptional<HTMLButtonElement>(
		document,
		'.alarm-dismiss',
	);

	if (
		!toggleBtn ||
		!panel ||
		!nameInput ||
		!timeInput ||
		!addBtn ||
		!repeatInput ||
		!errorEl ||
		!list ||
		!overlay ||
		!overlayCard ||
		!overlayName ||
		!overlayTime ||
		!snoozeBtn ||
		!dismissBtn
	) {
		console.error('Could not find all required alarm elements.');
		return;
	}

	// Narrow once so the closures below capture non-null bindings.
	const dom = {
		toggleBtn,
		panel,
		nameInput,
		timeInput,
		addBtn,
		repeatInput,
		errorEl,
		list,
		overlay,
		overlayCard,
		overlayName,
		overlayTime,
		snoozeBtn,
		dismissBtn,
	};

	// ---------- Core state ----------

	const storageKey = config.storageKey ?? 'alarms';
	let core = createAlarmCore(loadAlarms(storageKey));
	let intervalId: number | null = null;
	let beepIntervalId: number | null = null;
	let isPanelOpen = false;
	// True from the moment the panel is opened (we always move focus into
	// it) until close restores focus to the toggle. Focus may already be on
	// body by the time an outside-click close runs (mousedown blurs first),
	// so containment checks on activeElement are unreliable.
	let panelHadFocus = false;

	let sharedAudioCtx: AudioContext | null = null;

	function getAudioCtx() {
		if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
			sharedAudioCtx = new AudioContext();
		}
		return sharedAudioCtx;
	}

	// ---------- Persistence ----------

	function persist() {
		saveAlarms(storageKey, core.alarms);
	}

	// ---------- Render ----------

	function renderAlarmList() {
		dom.list.textContent = '';
		if (core.alarms.length === 0) {
			const empty = document.createElement('p');
			empty.className = 'alarm-empty';
			empty.textContent = 'No alarms yet';
			dom.list.append(empty);
			return;
		}
		for (const alarm of core.alarms) {
			const row = document.createElement('div');
			row.className = 'alarm-row';
			row.dataset.id = alarm.id;
			const isArmed = alarm.enabled || alarm.snoozedUntil !== null;
			if (!isArmed) row.classList.add('disabled');

			const name = document.createElement('span');
			name.className = 'alarm-row-name';
			name.textContent = alarmDisplayName(alarm);

			const time = document.createElement('span');
			time.className = 'alarm-row-time';
			time.textContent = formatAlarmTime(alarm.hour, alarm.minute);
			if (alarm.snoozedUntil !== null) {
				time.classList.add('snoozed');
			}

			const toggle = document.createElement('input');
			toggle.type = 'checkbox';
			toggle.className = 'alarm-row-toggle';
			toggle.checked = isArmed;
			toggle.setAttribute('aria-label', `Enable ${alarmDisplayName(alarm)}`);

			row.append(name, time);
			if (alarm.repeat) {
				// Daily-repeat indicator (US-002). role="img" + aria-label so
				// screen readers announce it; the SVG itself is presentational.
				const repeat = document.createElement('span');
				repeat.className = 'alarm-row-repeat';
				repeat.setAttribute('role', 'img');
				repeat.setAttribute('aria-label', 'Repeats daily');
				repeat.title = 'Repeats daily';
				repeat.innerHTML =
					'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" /></svg>';
				row.append(repeat);
			}

			const removeBtn = document.createElement('button');
			removeBtn.className = 'alarm-row-remove';
			removeBtn.textContent = '✕';
			removeBtn.setAttribute('aria-label', `Delete ${alarmDisplayName(alarm)}`);

			row.append(toggle, removeBtn);
			dom.list.append(row);
		}
	}

	function renderToggle() {
		dom.toggleBtn.classList.toggle('active', isPanelOpen);
		dom.toggleBtn.setAttribute('aria-expanded', String(isPanelOpen));
		const armed = core.alarms.some(
			(alarm) => alarm.enabled || alarm.snoozedUntil !== null,
		);
		dom.toggleBtn.classList.toggle('armed', armed);
	}

	// ---------- Ringing ----------

	function stopBeeps() {
		if (beepIntervalId !== null) {
			clearInterval(beepIntervalId);
			beepIntervalId = null;
		}
	}

	function ring(id: string) {
		const alarm = core.alarms.find((a) => a.id === id);
		if (!alarm) return;
		dom.overlayName.textContent = alarmDisplayName(alarm);
		dom.overlayTime.textContent = formatAlarmTime(alarm.hour, alarm.minute);
		dom.overlay.hidden = false;
		// Move focus into the modal so keyboard users land in the dialog.
		dom.overlayCard.focus();
		playBeep(getAudioCtx());
		beepIntervalId = window.setInterval(() => {
			playBeep(getAudioCtx());
		}, 1000);
	}

	function stopRinging() {
		stopBeeps();
		dom.overlay.hidden = true;
		// Return focus to a stable anchor after the dialog closes.
		dom.toggleBtn.focus();
		renderAlarmList();
	}

	function onSnooze() {
		const id = core.ringingId;
		if (id === null) return;
		core = snoozeAlarm(core, id, new Date());
		persist();
		stopRinging();
		renderToggle();
	}

	function onDismiss() {
		if (core.ringingId === null) return;
		core = dismissAlarm(core);
		stopRinging();
		renderToggle();
	}

	// ---------- Scheduler ----------

	function tick() {
		const result = tickAlarms(core, new Date());
		if (result.rangId === null) return;
		core = result.core;
		persist();
		renderAlarmList();
		renderToggle();
		ring(result.rangId);
	}

	// ---------- Create ----------

	function onAdd() {
		const time = parseAlarmTime(dom.timeInput.value);
		dom.errorEl.textContent = '';
		if (!time) {
			dom.errorEl.textContent = 'Set a valid time (HH:MM).';
			return;
		}
		core = addAlarm(core, dom.nameInput.value, time, dom.repeatInput.checked);
		persist();
		dom.nameInput.value = '';
		dom.timeInput.value = '';
		dom.repeatInput.checked = false;
		renderAlarmList();
		renderToggle();
	}

	// ---------- List events (delegation) ----------

	function onListChange(e: Event) {
		const target = e.target as HTMLElement;
		if (!target.classList.contains('alarm-row-toggle')) return;
		const row = target.closest('.alarm-row');
		const id = row instanceof HTMLElement ? row.dataset.id : undefined;
		if (!id) return;
		const checked = target instanceof HTMLInputElement && target.checked;
		core = setAlarmEnabled(core, id, checked);
		persist();
		renderAlarmList();
		renderToggle();
	}

	function onListClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.classList.contains('alarm-row-remove')) return;
		const row = target.closest('.alarm-row');
		const id = row instanceof HTMLElement ? row.dataset.id : undefined;
		if (!id) return;
		core = removeAlarm(core, id);
		persist();
		renderAlarmList();
		renderToggle();
	}

	// ---------- Panel toggle ----------

	function clockContainer(): HTMLElement | null {
		return rootElement.closest('#clock-container') as HTMLElement | null;
	}

	function openPanel() {
		flipAnimate(clockContainer(), () => {
			isPanelOpen = true;
			dom.panel.removeAttribute('hidden');
			renderToggle();
		});
		// Move focus into the panel so keyboard users continue from the
		// first field instead of the toggle.
		panelHadFocus = true;
		dom.nameInput.focus();
	}

	function closePanel() {
		flipAnimate(clockContainer(), () => {
			isPanelOpen = false;
			dom.panel.setAttribute('hidden', '');
			renderToggle();
		});
		// Restore focus to the toggle — the dialog trigger — whenever the
		// panel had focus during this open session.
		if (panelHadFocus) {
			panelHadFocus = false;
			dom.toggleBtn.focus();
		}
	}

	function togglePanel() {
		if (isPanelOpen) closePanel();
		else openPanel();
	}

	// ---------- Document-level events ----------

	function onDocumentClick(e: MouseEvent) {
		// Never close the panel while the ring overlay is up — the overlay
		// owns the interaction until it is dismissed or snoozed.
		if (core.ringingId !== null) return;
		const target = e.target as Node;
		if (isPanelOpen && !rootElement.contains(target)) {
			closePanel();
		}
	}

	function onDocumentKeydown(e: KeyboardEvent) {
		// While ringing, the overlay owns the keyboard: Escape/Enter dismiss,
		// and Tab is trapped between Snooze and Dismiss.
		if (core.ringingId !== null) {
			if (e.key === 'Escape' || e.key === 'Enter') {
				onDismiss();
				return;
			}
			if (e.key === 'Tab') {
				e.preventDefault();
				const order = [dom.snoozeBtn, dom.dismissBtn];
				const idx = order.indexOf(document.activeElement as HTMLButtonElement);
				const nextIdx =
					idx === -1
						? 0
						: (idx + (e.shiftKey ? -1 : 1) + order.length) % order.length;
				order[nextIdx].focus();
			}
			return;
		}
		if (e.key === 'Escape' && isPanelOpen) closePanel();
	}

	// ---------- Init ----------

	function init() {
		renderAlarmList();
		renderToggle();

		dom.toggleBtn.addEventListener('click', togglePanel);
		dom.addBtn.addEventListener('click', onAdd);
		dom.list.addEventListener('change', onListChange);
		dom.list.addEventListener('click', onListClick);
		dom.snoozeBtn.addEventListener('click', onSnooze);
		dom.dismissBtn.addEventListener('click', onDismiss);
		dom.nameInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') onAdd();
		});
		dom.timeInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') onAdd();
		});
		document.addEventListener('click', onDocumentClick);
		document.addEventListener('keydown', onDocumentKeydown);

		// Catch alarms that came due before this init (e.g. an expired snooze
		// or an alarm that arrived within the last grace window).
		tick();
		intervalId = window.setInterval(tick, 1000);
	}

	function destroy() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
		stopBeeps();
		if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
			sharedAudioCtx.close().catch(console.error);
		}
		document.removeEventListener('click', onDocumentClick);
		document.removeEventListener('keydown', onDocumentKeydown);
	}

	init();

	return {
		togglePanel,
		getState: () => core,
		destroy,
	};
}
