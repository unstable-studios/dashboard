import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
	const { loginWithRedirect, isAuthenticated, isLoading, error } = useAuth0();
	const location = useLocation();
	const navigate = useNavigate();

	const returnTo = (location.state as { returnTo?: string })?.returnTo || '/';

	console.log('[LoginPage] State:', {
		isAuthenticated,
		isLoading,
		error,
		returnTo,
	});

	useEffect(() => {
		if (error) {
			console.error('[LoginPage] Auth0 error:', error);
		}
		if (isAuthenticated && !isLoading) {
			console.log('[LoginPage] Authenticated, navigating to:', returnTo);
			navigate(returnTo);
		}
	}, [isAuthenticated, isLoading, navigate, returnTo, error]);

	const handleLogin = () => {
		console.log('[LoginPage] Initiating login redirect...');
		loginWithRedirect({
			appState: { returnTo },
		});
	};

	if (isLoading) {
		return (
			<div className='from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br'>
				<Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
			</div>
		);
	}

	return (
		<div className='from-background to-muted flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
			<Card className='w-full max-w-md'>
				<CardContent className='pt-8 pb-8'>
					<div className='flex flex-col items-center gap-8'>
						<div className='space-y-2 text-center'>
							<div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl'>
								<span className='text-primary text-3xl font-bold'>U</span>
							</div>
							<h1 className='text-2xl font-bold tracking-tight'>
								Welcome to the Dashboard
							</h1>
							<p className='text-muted-foreground text-sm'>
								Sign in to continue to your dashboard
							</p>
						</div>
						<Button size='lg' className='w-full' onClick={handleLogin}>
							Continue with Auth0
						</Button>
						<p className='text-muted-foreground text-center text-xs'>
							By signing in, you agree to our Terms of Service.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
