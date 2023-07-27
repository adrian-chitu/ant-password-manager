/**
 * @type {import('gatsby').GatsbyConfig}
 */

require('dotenv').config({
  path: `.env`,
});

module.exports = {
  siteMetadata: {
    title: `ANT Password Manager`,
    siteUrl: `https://www.yourdomain.tld`,
  },
  graphqlTypegen: true,

  // Plugin-ul Clerk.js pentru serviciul de Auth
  plugins: [
    {
      resolve: `gatsby-plugin-clerk`,
    },
    {
      resolve: `gatsby-source-supabase`,
      options: {
        supabaseUrl: 'https://qkmhhretewntihsyfnes.supabase.co',
        supabaseKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbWhocmV0ZXdudGloc3lmbmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcxMjQ4MzQsImV4cCI6MjAwMjcwMDgzNH0.vBzNyw_3lu9-fVNHiNK5aQSRUu-lIbI0XjFfXOPRNpI',
        types: [
          {
            type: 'User',
            query: (client) => client.from('users').select('*'), // sync or async
          },
        ],
      },
    },
  ],
};
