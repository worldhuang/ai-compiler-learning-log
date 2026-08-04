import { cookies } from "next/headers";
import { COOKIE_NAME, createAccessToken } from "./access-token";
import PasswordGate from "./PasswordGate";
import Planner from "./Planner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const suppliedToken = cookieStore.get(COOKIE_NAME)?.value;
  const expectedToken = await createAccessToken();

  if (!expectedToken || suppliedToken !== expectedToken) {
    return <PasswordGate />;
  }

  return <Planner />;
}
