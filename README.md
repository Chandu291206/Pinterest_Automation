# Pinterest Affiliate System

Next.js 14 app for running Pinterest affiliate campaigns with Supabase, Upstash Redis, OpenAI, and Amazon/Pinterest APIs.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, click **Add New Project** and import the repo.
3. Framework preset should auto-detect as **Next.js**.
4. Add all environment variables listed below in Vercel Project Settings -> Environment Variables.
5. Deploy.

`vercel.json` includes both required cron jobs:
- `0 * * * *` -> `/api/cron/run-pipeline`
- `0 6 * * *` -> `/api/cron/sync-analytics`

## Environment Variables (Vercel)

Add these values in Vercel for **Production** (and Preview if needed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PINTEREST_ACCESS_TOKEN`
- `PINTEREST_APP_ID`
- `PINTEREST_APP_SECRET`
- `AMAZON_ACCESS_KEY`
- `AMAZON_SECRET_KEY`
- `AMAZON_ASSOCIATE_TAG`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `CRON_SECRET`

## Where To Get API Keys (Direct Links)

- Supabase dashboard: https://supabase.com/dashboard/projects
  - Project -> Settings -> API for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Pinterest Developers: https://developers.pinterest.com/apps/
  - Create/select app, then generate OAuth access token and app credentials.
- Amazon Associates signup: https://affiliate-program.amazon.com/
  - Associate tag comes from Associates account.
- Amazon PA API docs: https://webservices.amazon.com/paapi5/documentation/
  - AWS access/secret keys: https://console.aws.amazon.com/iam/home#/security_credentials
- Upstash Redis: https://console.upstash.com/redis
  - Copy REST URL and REST token from your Redis database details.
- OpenAI API keys: https://platform.openai.com/api-keys
- Vercel env settings: https://vercel.com/dashboard

## Health Check

Endpoint:

`GET /api/health`

Returns:

```json
{
  "status": "ok",
  "timestamp": "2026-04-14T00:00:00.000Z",
  "env_check": {
    "supabase": true,
    "redis": true,
    "openai": true
  }
}
```

The route performs lightweight live checks against Supabase, Redis, and OpenAI.

## Manually Trigger Pipeline

Use your deployed domain and `CRON_SECRET`:

```bash
curl -X GET "https://YOUR-VERCEL-DOMAIN/api/cron/run-pipeline" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Manual analytics sync:

```bash
curl -X GET "https://YOUR-VERCEL-DOMAIN/api/cron/sync-analytics" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Add a New Campaign

Option 1 (UI):
- Open `/campaigns/new` in the dashboard.
- Fill campaign name, theme, keywords, posts/day, posting hours, and board ID.
- Submit.

Option 2 (API):

```bash
curl -X POST "https://YOUR-VERCEL-DOMAIN/api/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Fitness Essentials",
    "theme":"fitness",
    "amazon_keywords":["kettlebell","resistance bands","home gym"],
    "posts_per_day":3,
    "posting_hours":[9,14,20],
    "board_id":"1234567890"
  }'
```

## Daily Posting Limits (Recommended)

To stay within typical API and account safety limits:

- Start with `posts_per_day = 3` per campaign.
- Keep each campaign under `5-10` posts/day until results are stable.
- Prefer staggered posting hours (for example `[9,14,20]` UTC).
- Increase gradually after 7-14 days of stable performance and no API/rate-limit errors.
- Keep an eye on `/api/health` and cron logs in Vercel.

The pipeline already enforces per-campaign daily caps using Redis:
- Key format: `pins:{campaignId}:{YYYY-MM-DD}`
- It skips campaigns once `posts_per_day` is reached.
