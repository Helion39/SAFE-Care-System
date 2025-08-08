import React from 'react';

// Simple accordion implementation without external dependencies
export const Accordion = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const AccordionItem = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const AccordionTrigger = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

export const AccordionContent = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
