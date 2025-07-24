import React, { createContext, useContext, useState } from 'react';
import { cn } from './utils';
import { Button } from './button';

interface AlertDialogContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export function AlertDialog({ 
  children 
}: { 
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            {children}
          </div>
        </div>
      )}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogTrigger({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogTrigger must be used within AlertDialog');
  
  const { setIsOpen } = context;

  return (
    <button
      className={cn("", className)}
      onClick={() => setIsOpen(true)}
    >
      {children}
    </button>
  );
}

export function AlertDialogContent({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {children}
    </div>
  );
}

export function AlertDialogHeader({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export function AlertDialogDescription({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function AlertDialogFooter({ 
  children,
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>
      {children}
    </div>
  );
}

export function AlertDialogAction({ 
  children,
  className,
  ...props 
}: { 
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogAction must be used within AlertDialog');
  
  const { setIsOpen } = context;

  return (
    <Button
      className={cn("", className)}
      onClick={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function AlertDialogCancel({ 
  children,
  className,
  ...props 
}: { 
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogCancel must be used within AlertDialog');
  
  const { setIsOpen } = context;

  return (
    <Button
      variant="outline"
      className={cn("", className)}
      onClick={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </Button>
  );
}