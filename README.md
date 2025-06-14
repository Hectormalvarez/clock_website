# Simple Clock Website

A real-time clock web application deployed on AWS using CDK.

## Project Context

- **Frontend**: TypeScript clock display (HTML/CSS/TypeScript)
- **Infrastructure**: AWS CDK deploying to S3, CloudFront, Route53, ACM
- **Purpose**: Portfolio project demonstrating web development and AWS skills

## Current State

```mermaid
graph LR
    Browser --> CloudFront --> S3["S3 (Private)"]
    DNS["Route53"] --> CloudFront
    Certificate["ACM"] --- CloudFront
```

The site currently displays a digital clock that updates every second using JavaScript.

## Environment Configuration

This project uses environment-based configuration for different deployment environments. The deployment environment is now determined by a CDK context parameter passed during the `cdk deploy` or `cdk synth` commands.

1. **Configuration Structure**:
   - Environment configuration defined in `config/index.ts`
   - Supports development and production environments
   - Configurable domain names and AWS resources

2. **Deployment Commands**:
   ```bash
   npm run deploy:dev   # Deploy to development environment (uses -c environment=development)
   npm run deploy:prod  # Deploy to production environment (uses -c environment=production)
   npm run deploy       # Defaults to development environment
   ```

## Improvement Roadmap

### Frontend
1. **Time Zone Support**: Add dropdown to select different time zones
2. **Analog Clock**: Create SVG-based analog display with toggle option
3. **Theme Toggle**: Implement dark/light theme with system preference detection
4. **Accessibility**: Add ARIA attributes and keyboard navigation
5. **Date Display**: Show current date below clock

### Infrastructure
1. **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
2. **Monitoring**: CloudWatch metrics and basic alerts
3. **Performance**: Optimize caching and asset delivery

### Developer Experience
1. **Tests**: Add frontend unit tests and infrastructure tests
2. **Documentation**: Improve JSDoc comments and setup instructions

## Quick Start

```bash
npm install     # Install dependencies
npm run dev     # Local development
npm run deploy  # Deploy to AWS
```

### Deployment Requirements
- Node.js
- AWS CLI configured
- AWS CDK CLI installed
