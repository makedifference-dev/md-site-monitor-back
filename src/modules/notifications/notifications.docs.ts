import {
  generateSchemaFromInterface,
  buildEndpoint,
  ref,
} from '../docs/swagger.utils';

const testEmailRequestExample = {
  to: 'user@example.com',
  subject: 'Test Subject',
  message: 'Hello from test endpoint',
};

const testEmailSuccessResponseExample = {
  message: 'Test email sent successfully',
  data: { to: 'user@example.com', subject: 'Test Subject' },
};

const testEmailFailureResponseExample = {
  error: 'INTERNAL_ERROR',
  message: 'Failed to send test email',
  statusCode: 500,
};

export const notificationsDocs = {
  '/notifications/test-email': buildEndpoint(
    '/notifications/test-email',
    'post',
    'Send a test email (admin only)',
    {
      tag: 'Notifications',
      security: [{ bearerAuth: [] }],
      requestBody: { schema: ref('TestEmailRequest'), required: true },
      responses: {
        '200': { schema: ref('TestEmailSuccessResponse') },
        '500': {
          schema: ref('TestEmailFailureResponse'),
          description: 'Failed to send test email',
        },
      },
    }
  ),
};

export const notificationsSchemas = {
  TestEmailRequest: generateSchemaFromInterface(testEmailRequestExample, [
    'to',
    'subject',
    'message',
  ]),
  TestEmailSuccessResponse: generateSchemaFromInterface(
    testEmailSuccessResponseExample
  ),
  TestEmailFailureResponse: generateSchemaFromInterface(
    testEmailFailureResponseExample
  ),
};
