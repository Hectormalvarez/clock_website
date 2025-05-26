export type DeploymentConfig = {
  environment: 'development' | 'production';
  aws: {
    domainName: string;
    baseDomainName: string;
    hostedZoneId: string;
  };
};

const configs: Record<string, DeploymentConfig> = {
  development: {
    environment: 'development',
    aws: {
      domainName: process.env.AWS_DOMAIN_NAME || 'dev-clock.taylormadetech.net',
      baseDomainName: process.env.AWS_BASE_DOMAIN || 'taylormadetech.net',
      hostedZoneId: process.env.AWS_HOSTED_ZONE_ID || 'Z08476952AAJG5D55EAB6'
    }
  },
  production: {
    environment: 'production',
    aws: {
      domainName: process.env.AWS_DOMAIN_NAME || 'clock.taylormadetech.net',
      baseDomainName: process.env.AWS_BASE_DOMAIN || 'taylormadetech.net',
      hostedZoneId: process.env.AWS_HOSTED_ZONE_ID || 'Z08476952AAJG5D55EAB6'
    }
  }
};

export function getConfig(env: string = 'development'): DeploymentConfig {
  return configs[env] || configs.development;
}
