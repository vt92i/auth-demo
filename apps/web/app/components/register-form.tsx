import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as z from "zod";
import { apiClient } from "~/api";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "~/components/ui/input-group";
import { cn } from "~/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const formSchema = z
	.object({
		email: z.email("Please enter a valid email address."),
		password: z.string().min(8, "Password must be at least 8 characters long."),
		passwordConfirmation: z
			.string()
			.min(8, "Password must be at least 8 characters long."),
	})
	.refine((data) => data.password === data.passwordConfirmation, {
		message: "Passwords do not match.",
		path: ["passwordConfirmation"],
	});

export function RegisterForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			password: "",
			passwordConfirmation: "",
		},
	});

	const [showPassword, setShowPassword] = useState(false);

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await apiClient.register(data.email, data.password);
			toast.success("Registered successfully!", {
				duration: 1000,
				onAutoClose: () => {
					navigate("/auth/login");
				},
			});
		} catch (error) {
			// @ts-expect-error
			switch (error.response?.status) {
				case 409:
					toast.error("An account with this email already exists.");
					break;
				default:
					toast.error("An unexpected error occurred. Please try again.");
			}
		}
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle className="flex justify-between items-center">
						Create an account
						<ThemeToggle />
					</CardTitle>
					<CardDescription>
						Enter your information below to create your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Controller
								name="email"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="email">Email</FieldLabel>
										<Input
											{...field}
											id="email"
											aria-invalid={fieldState.invalid}
											disabled={form.formState.isSubmitting}
											placeholder="john.doe@example.com"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="password"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="password">Password</FieldLabel>
										<InputGroup>
											<InputGroupInput
												{...field}
												id="password"
												aria-invalid={fieldState.invalid}
												disabled={form.formState.isSubmitting}
												type={showPassword ? "text" : "password"}
												placeholder="*********"
											/>
											<InputGroupAddon align="inline-end">
												<InputGroupButton
													aria-label="Toggle Password Visibility"
													title="Toggle Password Visibility"
													size="icon-xs"
													onClick={() => {
														setShowPassword(!showPassword);
													}}
												>
													{showPassword ? <EyeOff /> : <Eye />}
												</InputGroupButton>
											</InputGroupAddon>
										</InputGroup>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="passwordConfirmation"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="passwordConfirmation">
											Password Confirmation
										</FieldLabel>
										<InputGroup>
											<InputGroupInput
												{...field}
												id="passwordConfirmation"
												aria-invalid={fieldState.invalid}
												disabled={form.formState.isSubmitting}
												type={showPassword ? "text" : "password"}
												placeholder="*********"
											/>
											<InputGroupAddon align="inline-end">
												<InputGroupButton
													aria-label="Toggle Password Visibility"
													title="Toggle Password Visibility"
													size="icon-xs"
													onClick={() => {
														setShowPassword(!showPassword);
													}}
												>
													{showPassword ? <EyeOff /> : <Eye />}
												</InputGroupButton>
											</InputGroupAddon>
										</InputGroup>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Field>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									Register
								</Button>
								<FieldDescription className="text-center">
									Already have an account? <a href="/auth/login">Sign in</a>
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
