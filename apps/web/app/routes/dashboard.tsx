import Cookies from "js-cookie";
import { GalleryVerticalEnd, PopcornIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, redirect } from "react-router";
import { toast } from "sonner";
import { apiClient } from "~/api";
import { ThemeToggle } from "~/components/theme-toggle";
import { Alert, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/dashboard";

type UserProfile = {
	sub: string;
	email: string;
	typ: string;
	iss: string;
	aud: string;
	iat: number;
	exp: number;
};

export function meta({}: Route.MetaArgs) {
	return [{ title: "Dashboard Page" }];
}

export async function clientLoader() {
	if (!Cookies.get("access_token")) {
		try {
			await apiClient.refreshToken();
		} catch (_error) {
			Cookies.remove("access_token");
			return redirect("/auth/login");
		}
	}

	try {
		const user = (await apiClient.getProfile()) as UserProfile;
		return { user };
	} catch (_error) {
		Cookies.remove("access_token");
		return redirect("/auth/login");
	}
}

export default function Page({ loaderData }: Route.ComponentProps) {
	const handleRefreshToken = async () => {
		try {
			await apiClient.refreshToken();
			toast.success("Token refreshed successfully!");
			setUser((await apiClient.getProfile()) as UserProfile);
		} catch (_error) {
			toast.error("Failed to refresh token. Please log in again.");
			Cookies.remove("access_token");
			window.location.href = "/auth/login";
		}
	};

	const [user, setUser] = useState<UserProfile>(loaderData.user);
	const [timeLeft, setTimeLeft] = useState(user.exp * 1000 - Date.now());

	useEffect(() => {
		const id = setInterval(() => {
			setTimeLeft(user.exp * 1000 - Date.now());
		}, 1000);
		return () => clearInterval(id);
	}, [user.exp]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Just ignore it because it works as intended.
	useEffect(() => {
		if (timeLeft <= 1000) handleRefreshToken();
	}, [timeLeft]);

	return (
		<div className="animate-in fade-in duration-1000 bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a href="/" className="flex items-center gap-2 self-center font-medium">
					<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
						<GalleryVerticalEnd className="size-4" />
					</div>
					Acme Inc.
				</a>
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex justify-between items-center">
								Welcome to your Dashboard
								<ThemeToggle />
							</CardTitle>
							<CardDescription>
								Here is your profile information:
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="subject">Subject</FieldLabel>
									<Input id="subject" value={user.sub} readOnly />
								</Field>
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input id="email" value={user.email} readOnly />
								</Field>
								<Field>
									<FieldLabel htmlFor="issuer">Issuer</FieldLabel>
									<Input id="issuer" value={user.iss} readOnly />
								</Field>
								<Field>
									<FieldLabel htmlFor="audience">Audience</FieldLabel>
									<Input id="audience" value={user.aud} readOnly />
								</Field>
								<Field>
									<FieldLabel htmlFor="issuedAt">Issued At</FieldLabel>
									<Input
										id="issuedAt"
										value={new Date(user.iat * 1000).toLocaleString()}
										readOnly
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="expiresAt">Expires At</FieldLabel>
									<Input
										id="expiresAt"
										value={new Date(user.exp * 1000).toLocaleString()}
										readOnly
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="accessToken">Access Token</FieldLabel>
									<Textarea
										id="accessToken"
										value={Cookies.get("access_token") || ""}
										rows={8}
										readOnly
									/>
								</Field>
								<Field>
									<Alert>
										<PopcornIcon />
										<AlertTitle>
											Token will be refreshed in{" "}
											{Math.max(0, Math.floor(timeLeft / 1000))} seconds
										</AlertTitle>
									</Alert>
									<Button type="button" onClick={handleRefreshToken}>
										Refresh Token
									</Button>
									<Button variant="outline" asChild>
										<Link to="/auth/logout">Logout</Link>
									</Button>
								</Field>
							</FieldGroup>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
