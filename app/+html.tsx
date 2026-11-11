import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="monetag" content="9bbd9ea6c793c44a0acaacb7b9151150" />
        <title>Celebrity&apos;s Chat</title>
        <meta name="description" content="Connect, share, chat and discover with Celebrity's Chat." />
      </head>
      <body>
        <ScrollViewStyleReset />
        <div id="root">{children}</div>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){var s=document.createElement('script');s.dataset.zone='12238095';s.src='https://nap5k.com/tag.min.js';(document.body||document.documentElement).appendChild(s);})();",
          }}
        />
      </body>
    </html>
  );
}
