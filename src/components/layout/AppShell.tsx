import { useAuth0 } from '@auth0/auth0-react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Home, Link as LinkIcon, FileText, Settings, Shield } from 'lucide-react';

interface AppShellProps {
	children: React.ReactNode;
}

const navItems = [
	{ path: '/', label: 'Dashboard', icon: Home },
	{ path: '/links', label: 'Links', icon: LinkIcon },
	{ path: '/docs', label: 'Documents', icon: FileText },
];

export function AppShell({ children }: AppShellProps) {
	const { user, logout } = useAuth0();
	const location = useLocation();

	const handleLogout = () => {
		logout({
			logoutParams: {
				returnTo: window.location.origin,
			},
		});
	};

	const initials = user?.name
		?.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase() || user?.email?.[0].toUpperCase() || '?';

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b sticky top-0 bg-background z-50">
				<div className="container mx-auto px-4 h-14 flex items-center justify-between">
					<div className="flex items-center gap-6">
						<Link to="/" className="font-semibold text-lg">
							Unstable Studios
						</Link>
						<nav className="hidden md:flex items-center gap-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = location.pathname === item.path;
								return (
									<Link key={item.path} to={item.path}>
										<Button
											variant={isActive ? 'secondary' : 'ghost'}
											size="sm"
											className="gap-2"
										>
											<Icon className="h-4 w-4" />
											{item.label}
										</Button>
									</Link>
								);
							})}
						</nav>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="gap-2">
								<Avatar className="h-6 w-6">
									<AvatarImage src={user?.picture} />
									<AvatarFallback className="text-xs">{initials}</AvatarFallback>
								</Avatar>
								<span className="hidden sm:inline">{user?.name || user?.email}</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem asChild>
								<Link to="/settings" className="gap-2">
									<Settings className="h-4 w-4" />
									Settings
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/admin" className="gap-2">
									<Shield className="h-4 w-4" />
									Admin
								</Link>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout}>
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</header>

			{/* Mobile nav */}
			<nav className="md:hidden border-b px-4 py-2 flex gap-1 overflow-x-auto">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = location.pathname === item.path;
					return (
						<Link key={item.path} to={item.path}>
							<Button
								variant={isActive ? 'secondary' : 'ghost'}
								size="sm"
								className="gap-2"
							>
								<Icon className="h-4 w-4" />
								{item.label}
							</Button>
						</Link>
					);
				})}
			</nav>

			<Separator />

			{/* Main content */}
			<main className="container mx-auto px-4 py-6">
				{children}
			</main>
		</div>
	);
}
