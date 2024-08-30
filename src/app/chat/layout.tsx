import Image from "next/image";
import Link from "next/link";
import {
  LineChart,
  LucideSettings,
  Package,
  Package2,
  PanelLeft,
  Settings,
  User,
  Users,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "@/components/toggle";
import { AvatarIcon, ChatBubbleIcon } from "@radix-ui/react-icons";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="">
      <TooltipProvider>
        <div className="flex max-h-[800px] w-full flex-col bg-muted/40  m-auto">
          <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col mr-10 border-r bg-background sm:flex">
            <nav className="flex flex-col  items-center gap-4 px-2 py-4">
              <Link
                href="#"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
              >
                <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
                <span className="sr-only">Acme Inc</span>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/chat/chats"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <ChatBubbleIcon className="h-5 w-5" />
                    <span className="sr-only">Chat</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/chat/adduser"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <User className="h-5 w-5" />
                    <span className="sr-only">Add user</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Add User</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/chat/create-group"
                    className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Create-group</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">create-group</TooltipContent>
              </Tooltip>
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/chat/settings"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                  >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
              <span>
                <ModeToggle />
              </span>
            </nav>
          </aside>
          <div className="flex flex-col  sm:pl-14">
            <header className="fixed right-0 left-0 top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                  <nav className="grid gap-6 text-lg font-medium">
                    <Link
                      href="/chat/chats"
                      className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    >
                      <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
                      <span className="sr-only">Acme Inc</span>
                    </Link>
                    <Link
                      href="/chat/chats"
                      className="flex items-center gap-4 px-2.5 text-foreground"
                    >
                      <ChatBubbleIcon className="h-5 w-5" />
                      chats
                    </Link>
                    <Link
                      href="/chat/adduser"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <User className="h-5 w-5" />
                      Add-user
                    </Link>
                    <Link
                      href="/chat/create-group"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <Users className="h-5 w-5" />
                      Create-group
                    </Link>
                    <Link
                      href="/chat/settings"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <LucideSettings className="h-5 w-5" />
                      Settings
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
            </header>
            {children}
          </div>
        </div>
      </TooltipProvider>
    </section>
  );
}
