import sanityClient from '@sanity/client'

export const client = sanityClient({
  projectId: '6fa0c977',
  dataset: 'production',
  apiVersion: 'v1',
  token: 'sk6HEcdQQy8CCh88owqkbT4Imqzf95ZUCdIxjE63cg8IBXxdtXRvbxnriHOglKYbuW83IRDwqzfXYw01METsATriwAN2rgtVyr2Xgw4r0YaxaqKc9kibFKLnH6lIEfwHjdoI65mUrkAduWbKeYRr1TQUE3iAiWxf57Yc8C30kF4ukLY1yr0k',
  useCdn: false,
})
