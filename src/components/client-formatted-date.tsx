
"use client";

import { useState, useEffect } from 'react';

interface ClientFormattedDateProps {
  dateString: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

export const ClientFormattedDate = ({ dateString, options, className }: ClientFormattedDateProps) => {
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
      // This effect runs only on the client, after the initial render.
      const date = new Date(dateString);
      setFormattedDate(date.toLocaleString('fr-FR', options));
    }, [dateString, options]);
    
    // By returning the formatted date inside a span with suppressHydrationWarning,
    // we tell React to ignore the difference between the server-rendered empty content
    // and the client-rendered date, which prevents the hydration error.
    return (
        <span className={className} suppressHydrationWarning>
            {formattedDate}
        </span>
    );
};
