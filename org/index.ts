import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Import the program's configuration settings.
const config = new pulumi.Config();

const githubIdentityProvider = new aws.iam.OpenIdConnectProvider(
  "github-identity-provider",
  {
    url: "https://token.actions.githubusercontent.com",
    clientIdLists: ["sts.amazonaws.com"],
    thumbprintLists: [
      // Taken from https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
      "6938fd4d98bab03faadb97b34396831e3780aea1",
      "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
    ],
  }
);

const githubActionsRole = new aws.iam.Role("github-actions-role", {
  assumeRolePolicy: {
    Id: "Github-Actions",
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Federated: githubIdentityProvider.arn,
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
            "token.actions.githubusercontent.com:sub":
              "repo:octo-org/octo-repo:ref:refs/heads/octo-branch",
          },
        },
      },
    ],
  },
});

const githubActionsPolicy = new aws.iam.Policy("github-actions-policy", {
  policy: {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "Pulumi",
        Effect: "Allow",
        Action: ["s3:*", "cloudfront:*"],
        Resource: ["*"],
      },
    ],
  },
});

const githubActionsPolicyAttachment = new aws.iam.PolicyAttachment(
  "github-actions-policy-attachment",
  {
    policyArn: githubActionsPolicy.arn,
    roles: [githubActionsRole],
  }
);

export const githubActionsRoleName = githubActionsRole.name;
export const githubActionsRoleArn = githubActionsRole.arn;
