\# Tetavio Project – Codex Context



\## Project Overview

This is a full-stack application:



\- Frontend: Vite + React (hosted on Hostinger)

\- Backend: NestJS (hosted on Render)

\- Database: PostgreSQL (Render)



\---



\## Deployment Architecture



Frontend:

\- Built with Vite

\- Hosted on Hostinger (public\_html)

\- Production domain:

https://www.tetavio.com

\- Uses environment variable:



VITE\_API\_BASE\_URL=https://tetavio-backend.onrender.com/api/v1



\---



Backend:

\- Hosted on Render

\- Root directory: backend

\- Start command:

&#x20; npm run start:prod



\- Build command:

&#x20; npm install --include=dev \&\& npx prisma generate \&\& npx prisma migrate deploy \&\& npm run prisma:seed \&\& npm run build



\---



Database:

\- PostgreSQL on Render

\- Uses INTERNAL DATABASE URL in production



\---



\## Important URLs



Backend API:

https://tetavio-backend.onrender.com/api/v1



Swagger:

https://tetavio-backend.onrender.com/api/docs



Frontend:

https://www.tetavio.com



\---



\## Frontend Build Process



To rebuild frontend:



npm run build



Upload:

\- Upload contents of dist/ to Hostinger public\_html

\- Do NOT upload dist folder itself



\---



\## Routing (IMPORTANT)



Project uses SPA routing.



Hostinger must contain .htaccess:



<IfModule mod\_rewrite.c>

&#x20; RewriteEngine On

&#x20; RewriteBase /

&#x20; RewriteRule ^index\\.html$ - \[L]

&#x20; RewriteCond %{REQUEST\_FILENAME} !-f

&#x20; RewriteCond %{REQUEST\_FILENAME} !-d

&#x20; RewriteRule . /index.html \[L]

</IfModule>



\---



\## Backend Environment Variables



DATABASE\_URL = Render Internal DB URL

NODE\_ENV = production

JWT\_ACCESS\_SECRET = secret

JWT\_REFRESH\_SECRET = secret

CORS\_ORIGINS = https://www.tetavio.com,http://localhost:5173,http://localhost:5175

FRONTEND\_PRODUCTION\_URL=https://www.tetavio.com



\---



\## Key Rules



\- Frontend API must always use VITE\_API\_BASE\_URL

\- Backend runs only from /backend folder

\- Never use external DB URL in production

\- Always rebuild frontend after .env change

\- Always upload fresh dist after build



\---



\## Common Mistakes



\- Uploading dist folder instead of its contents

\- Wrong API URL in frontend

\- Missing .htaccess

\- Using external DB URL in production

\- Forgetting npm run build



\---



\## Developer Workflow



Frontend change:

→ npm run build → upload dist



Backend change:

→ git push → Render auto deploy



\---



\## Notes



\- Render free instance may sleep (slow first request)

\- System already tested:

&#x20; - Login works

&#x20; - API works

&#x20; - DB connected

