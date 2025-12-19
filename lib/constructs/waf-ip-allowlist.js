const { Construct } = require('constructs');
const wafv2 = require('aws-cdk-lib/aws-wafv2');

/**
 * AWS WAF WebACL with IP allowlist for CloudFront distribution
 *
 * Restricts access to specified IP addresses only. Useful for POC/testing
 * environments to prevent unauthorized access.
 *
 * Note: WAF for CloudFront must be created in us-east-1 region
 */
class WafIpAllowlist extends Construct {
  constructor(scope, id, props = {}) {
    super(scope, id);

    const { allowedIps = [], environment = 'unknown' } = props;

    // Validate IP addresses are provided
    if (!allowedIps || allowedIps.length === 0) {
      console.warn('⚠️  No IP addresses provided for WAF allowlist. WAF will block all traffic!');
    }

    // Create IP Set with allowed IP addresses
    this.ipSet = new wafv2.CfnIPSet(this, 'AllowedIpSet', {
      name: `cardmaker-allowed-ips-${environment}`,
      description: `Allowed IP addresses for Cardmaker ${environment} environment`,
      scope: 'CLOUDFRONT', // Must be CLOUDFRONT for CloudFront distributions
      ipAddressVersion: 'IPV4',
      addresses: allowedIps.length > 0 ? allowedIps : ['0.0.0.0/32'], // Dummy IP if none provided
    });

    // Create WebACL with IP allowlist rule
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `cardmaker-web-acl-${environment}`,
      description: `WAF for Cardmaker ${environment} - IP allowlist`,
      scope: 'CLOUDFRONT', // Must be CLOUDFRONT for CloudFront distributions
      defaultAction: {
        block: {}, // Block all traffic by default
      },
      rules: [
        {
          name: 'AllowListedIPs',
          priority: 1,
          statement: {
            ipSetReferenceStatement: {
              arn: this.ipSet.attrArn,
            },
          },
          action: {
            allow: {}, // Allow traffic from IP set
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: `AllowListedIPs-${environment}`,
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `cardmaker-waf-${environment}`,
      },
    });
  }

  /**
   * Returns the WebACL ARN for associating with CloudFront
   */
  getWebAclArn() {
    return this.webAcl.attrArn;
  }

  /**
   * Returns the WebACL resource
   */
  getWebAcl() {
    return this.webAcl;
  }
}

module.exports = { WafIpAllowlist };
