import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/agents/:path*",
    "/knowledge/:path*",
    "/channels/:path*",
    "/customers/:path*",
    "/metrics/:path*",
    "/usage/:path*",
    "/settings/:path*",
    "/admin/:path*",
  ],
};
