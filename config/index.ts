export type DeploymentConfig = {
  environment: 'development' | 'production';
  aws: {
    domainName: string;
    baseDomainName: string;
    hostedZoneId: string;
  };
};

export function getConfig(env: string = 'development', envVars: Record<string, string | undefined>): DeploymentConfig {
  // Ensure the environment is valid, default to 'development' if not provided or invalid
  const resolvedEnv = (env === 'production' || env === 'development') ? env : 'development';

  // Define the configuration for each environment, strictly relying on environment variables
  const configs: Record<string, DeploymentConfig> = {
    development: {
      environment: 'development',
      aws: {
        // Prioritize AWS_DOMAIN_NAME for CI/CD context, fall back to VITE_AWS_DOMAIN_NAME if needed (e.g., for local Vite dev)
        domainName: envVars.AWS_DOMAIN_NAME_DEV || envVars.VITE_AWS_DOMAIN_NAME_DEV || '',
        baseDomainName: envVars.AWS_BASE_DOMAIN_DEV || envVars.VITE_AWS_BASE_DOMAIN_DEV || '',
        hostedZoneId: envVars.AWS_HOSTED_ZONE_ID_DEV || envVars.VITE_AWS_HOSTED_ZONE_ID_DEV || ''
      }
    },
    production: {
      environment: 'production',
      aws: {
        domainName: envVars.AWS_DOMAIN_NAME_PROD || envVars.VITE_AWS_DOMAIN_NAME_PROD || '',
        baseDomainName: envVars.AWS_BASE_DOMAIN_PROD || envVars.VITE_AWS_BASE_DOMAIN_PROD || '',
        hostedZoneId: envVars.AWS_HOSTED_ZONE_ID_PROD || envVars.VITE_AWS_HOSTED_ZONE_ID_PROD || ''
      }
    }
  };

  // Add a check to ensure required variables are present for the chosen environment
  const currentConfig = configs[resolvedEnv];
  if (!currentConfig.aws.domainName || !currentConfig.aws.baseDomainName || !currentConfig.aws.hostedZoneId) {
    throw new Error(`Missing required AWS environment variables for ${resolvedEnv} environment. Please ensure AWS_DOMAIN_NAME_${resolvedEnv.toUpperCase()}, AWS_BASE_DOMAIN_${resolvedEnv.toUpperCase()}, and AWS_HOSTED_ZONE_ID_${resolvedEnv.toUpperCase()} are set.`);
  }

  return currentConfig;
}
