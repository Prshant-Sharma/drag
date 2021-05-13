// pages/client-side.js
import Head from "next/head";
import { useEffect } from 'react';
import ClientOnly from "../components/clientOnly";
import { default as FirstComponent } from "../components/FormDefault";
import Drag from "./Drag";

export default function ClientSide() {
  return (
    <div>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.0/css/font-awesome.min.css"
        />
      </Head>

      <main >
        <ClientOnly>
          <FirstComponent />
          
         
         
          <Drag/>
        </ClientOnly>
      </main>
    </div>
  );
}