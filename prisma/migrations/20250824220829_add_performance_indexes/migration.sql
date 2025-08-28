-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "public"."projects"("userId");

-- CreateIndex
CREATE INDEX "projects_isActive_idx" ON "public"."projects"("isActive");

-- CreateIndex
CREATE INDEX "projects_userId_isActive_idx" ON "public"."projects"("userId", "isActive");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "public"."projects"("createdAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "public"."refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "public"."refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "public"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "site_checks_projectId_idx" ON "public"."site_checks"("projectId");

-- CreateIndex
CREATE INDEX "site_checks_status_idx" ON "public"."site_checks"("status");

-- CreateIndex
CREATE INDEX "site_checks_checkedAt_idx" ON "public"."site_checks"("checkedAt");

-- CreateIndex
CREATE INDEX "site_checks_projectId_checkedAt_idx" ON "public"."site_checks"("projectId", "checkedAt");

-- CreateIndex
CREATE INDEX "site_checks_projectId_status_idx" ON "public"."site_checks"("projectId", "status");

-- CreateIndex
CREATE INDEX "site_checks_sslValid_idx" ON "public"."site_checks"("sslValid");

-- CreateIndex
CREATE INDEX "site_checks_sslExpiry_idx" ON "public"."site_checks"("sslExpiry");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");
