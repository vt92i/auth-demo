import Cookies from "js-cookie";
import { redirect } from "react-router";

export async function clientLoader() {
	if (Cookies.get("access_token")) return redirect("/dashboard");
	return redirect("/auth/login");
}
export default function Page() {
	return null;
}
