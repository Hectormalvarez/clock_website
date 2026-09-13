import { playBeep } from '@/shared/audio/beep';
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
	const errorEl = queryOptional<HTMLElement>(rootElement, '.alarm-error');
	const list = queryOptional<HTMLElement>(rootElement, '.alarm-list');

	const overlay = queryOptional<HTMLElement>(document, '.alarm-overlay');
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
		!errorEl ||
		!list ||
		!overlay ||
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
		errorEl,
		list,
		overlay,
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

			const removeBtn = document.createElement('button');
			removeBtn.className = 'alarm-row-remove';
			removeBtn.textContent = '✕';
			removeBtn.setAttribute('aria-label', `Delete ${alarmDisplayName(alarm)}`);

			row.append(name, time, toggle, removeBtn);
			dom.list.append(row);
		}
	}

	function renderToggle() {
		dom.toggleBtn.classList.toggle('active', isPanelOpen);
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
		playBeep(getAudioCtx());
		beepIntervalId = window.setInterval(() => {
			playBeep(getAudioCtx());
		}, 1000);
	}

	function stopRinging() {
		stopBeeps();
		dom.overlay.hidden = true;
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
		core = addAlarm(core, dom.nameInput.value, time);
		persist();
		dom.nameInput.value = '';
		dom.timeInput.value = '';
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

	// FLIP animation: smoothly animate #clock-container movement when the
	// panel is added/removed (which re-centers the container in the body).
	// Mirrors the timer feature's open/close behaviour so both panels feel
	// the same.
	function flipAnimateClockContainer(action: () => void) {
		const container = rootElement.closest(
			'#clock-container',
		) as HTMLElement | null;
		if (!container) {
			action();
			return;
		}

		// Lock body overflow so the page can't scroll while the height changes
		const prevBodyOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const firstRect = container.getBoundingClientRect();

		action();

		const lastRect = container.getBoundingClientRect();
		const deltaY = firstRect.top - lastRect.top;
		container.style.transition = 'none';
		container.style.transform = `translateY(${deltaY}px)`;

		requestAnimationFrame(() => {
			container.style.transition =
				'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
			container.style.transform = '';
		});

		const onEnd = () => {
			container.removeEventListener('transitionend', onEnd);
			container.style.transition = '';
			container.style.transform = '';
			document.body.style.overflow = prevBodyOverflow;
		};
		container.addEventListener('transitionend', onEnd);

		// Fallback in case transitionend doesn't fire
		setTimeout(onEnd, 400);
	}

	function openPanel() {
		flipAnimateClockContainer(() => {
			isPanelOpen = true;
			dom.panel.removeAttribute('hidden');
			renderToggle();
		});
	}

	function closePanel() {
		flipAnimateClockContainer(() => {
			isPanelOpen = false;
			dom.panel.setAttribute('hidden', '');
			renderToggle();
		});
	}

	function togglePanel() {
		if (isPanelOpen) closePanel();
		else openPanel();
	}

	// ---------- Document-level events ----------

	function onDocumentClick(e: MouseEvent) {
		const target = e.target as Node;
		if (isPanelOpen && !rootElement.contains(target)) {
			closePanel();
		}
	}

	function onDocumentKeydown(e: KeyboardEvent) {
		// While ringing, Escape and Enter dismiss — the overlay takes priority
		// over the panel-close shortcut.
		if (core.ringingId !== null && (e.key === 'Escape' || e.key === 'Enter')) {
			onDismiss();
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
