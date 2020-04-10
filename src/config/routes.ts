class Route {
  name: string;
  description?: string;
  path?: string;
  children?: Route[];
  version?: string;
}

export default function getRoutesTree(): Route[] {
  return [
    {
      'name': 'Admin',
      'description': 'Admin endpoints',
      'path': '',
      'children': [
        {
          'name': 'AdminModule',
          'path': 'admin',
          'version': '1.0.0'
        }
      ]
    },
    {
      'name': 'Auth',
      'description': 'All things related to authentication',
      'children': [
        {
          'name': 'AuthV1Module',
          'path': 'auth/v1',
          'version': '1.0.0'
        }
      ]
    },
    {
      'name': 'Insights',
      'description': 'All things related to Insights',
      'children': [
        {
          'name': 'InsightsV1Module',
          'path': 'insights/v1',
          'version': '1.0.0'
        }
      ]
    }
  ];
}