import AuthForm from "@/components/AuthForm";

export const metadata = { title: "login — PHOTOBOOTH STUDIO" };

export default function Page({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return <AuthForm mode="login" next={searchParams.next} notice={searchParams.error ? "That link is invalid or expired. Please try again." : undefined} />;
}
