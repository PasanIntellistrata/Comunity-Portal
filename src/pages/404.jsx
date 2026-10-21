import React from 'react';
import { Page, Navbar, Block, Button } from 'framework7-react';
import { Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <Page>
      <Navbar title="Page Not Found" />
      <Block strong inset className="text-align-center">
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <Search size={54} color="#64748b" />
        </div>
        <h3>Page Not Found</h3>
        <p>Sorry, the page you requested doesn't exist.</p>
        <Button fill round href="/" color="blue">
          Go Home
        </Button>
      </Block>
    </Page>
  );
};

export default NotFoundPage;
