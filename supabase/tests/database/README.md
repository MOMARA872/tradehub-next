# Trade Offers DB Tests

Plain-SQL verification scenarios. Each script runs end-to-end and
uses `raise exception` for assertions. Exit code 0 = pass.

## Running

```bash
export LOCAL_DB="$(supabase status -o json | jq -r .DB_URL)"
supabase db reset          # apply all migrations
psql "$LOCAL_DB" -f supabase/tests/database/test_<name>.sql
```

## Running all
```bash
for f in supabase/tests/database/test_*.sql; do
  echo "=== $f ===" && psql "$LOCAL_DB" -f "$f" || break
done
```
