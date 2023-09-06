import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "./ui/button";
import { ElementType, ReactNode } from "react";
import Link, { LinkProps } from "next/link";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "./ui/dropdown-menu";

type MenuButtonProps = LinkProps & {
  icon: ElementType
  children: ReactNode
}

function Root({ children, icon: Icon, ...otherProps }: MenuButtonProps) {
  return (
    <Link className="group flex px-4 h-10 justify-start items-center relative hover:bg-accent rounded-md" {...otherProps}>
      <Icon className="mr-2" />
      {children}
      <div className="ml-auto flex justify-center w-5">
        <p className="text-muted-foreground">0</p>
      </div>
    </Link>
  )
}

function MoreButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="invisible absolute bg-accent right-0 text-muted-foreground hover:text-foreground group-hover:visible data-[state=open]:visible">
          <MoreHorizontalIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const MenuButton = { Root, MoreButton }