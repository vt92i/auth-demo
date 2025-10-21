import { redirect } from "react-router";
import { apiClient } from "~/api";

export async function clientLoader() {
	await apiClient.logout();
	return redirect("/auth/login");
}
export default function Page() {
	return null;
}
