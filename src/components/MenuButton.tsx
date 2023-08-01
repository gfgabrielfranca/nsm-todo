import { MoreHorizontalIcon } from "lucide-react";
import { Button } from "./ui/button";
import { ElementType, ReactNode } from "react";
import Link, { LinkProps } from "next/link";

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
    <Button variant="ghost" className="hidden absolute bg-accent right-0 text-muted-foreground hover:text-foreground group-hover:flex">
      <MoreHorizontalIcon className="h-5 w-5" />
    </Button>
  )
}

export const MenuButton = { Root, MoreButton }