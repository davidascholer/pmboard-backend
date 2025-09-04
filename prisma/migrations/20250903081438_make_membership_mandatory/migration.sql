-- AlterTable
ALTER TABLE "public"."Token" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() AT TIME ZONE 'UTC') + INTERVAL '5 minutes';

-- Create function to check if user has membership
CREATE OR REPLACE FUNCTION check_user_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations, we'll allow it since membership will be created separately
  -- For UPDATE/DELETE operations on User table, ensure membership exists
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM "public"."Membership" WHERE "userId" = OLD."id") THEN
      RAISE EXCEPTION 'User must have a membership';
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for membership deletion to prevent orphaned users
CREATE OR REPLACE FUNCTION prevent_orphaned_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow deletion if user is being deleted too (CASCADE will handle this)
  -- Otherwise prevent membership deletion if it would leave user without membership
  IF OLD."userId" IS NOT NULL AND 
     EXISTS (SELECT 1 FROM "public"."User" WHERE "id" = OLD."userId") THEN
    RAISE EXCEPTION 'Cannot delete membership: User must have a membership';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent membership deletion unless user is also being deleted
CREATE TRIGGER prevent_membership_deletion
  BEFORE DELETE ON "public"."Membership"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_orphaned_user();
