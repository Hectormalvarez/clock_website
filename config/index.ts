export type DeploymentConfig = {
  environment: 'development' | 'production';
  aws: {
    domainName: string;
    baseDomainName: string;
    hostedZoneId: string;
  };
};

export function getConfig(env: string = 'development', envVars: Record<string, string | undefined>): DeploymentConfig {
  const configs: Record<string, DeploymentConfig> = {
    development: {
      environment: 'development',
      aws: {
        domainName: envVars.VITE_AWS_DOMAIN_NAME || envVars.AWS_DOMAIN_NAME || 'dev-clock.taylormadetech.net',
        baseDomainName: envVars.VITE_AWS_BASE_DOMAIN || envVars.AWS_BASE_DOMAIN || 'taylormadetech.net',
        hostedZoneId: envVars.VITE_AWS_HOSTED_ZONE_ID || envVars.AWS_HOSTED_ZONE_ID || 'Z08476952AAJG5D55EAB6'
      }
    },
    production: {
      environment: 'production',
      aws: {
        domainName: envVars.VITE_AWS_DOMAIN_NAME || envVars.AWS_DOMAIN_NAME || 'clock.taylormadetech.net',
        baseDomainName: envVars.VITE_AWS_BASE_DOMAIN || envVars.AWS_BASE_DOMAIN || 'taylormadetech.net',
        hostedZoneId: envVars.VITE_AWS_HOSTED_ZONE_ID || envVars.AWS_HOSTED_ZONE_ID || 'Z08476952AAJG5D55EAB6'
      }
    }
  };
  return configs[env] || configs.development;
}
