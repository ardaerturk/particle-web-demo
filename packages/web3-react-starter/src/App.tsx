import React, { useEffect } from 'react';
import { AuthType } from '@particle-network/auth';
import './App.css';
import { hooks as particleHooks, particleAuth } from './particleAuthConnector';
import { hooks as intersendHooks, intersendAuth } from './intersendAuthConnector';

const { useChainId: useParticleChainId, useAccounts: useParticleAccounts, useIsActive: useParticleIsActive } = particleHooks;
const { useChainId: useIntersendChainId, useAccounts: useIntersendAccounts, useIsActive: useIntersendIsActive } = intersendHooks;

function App() {
  // Particle states
  const particleChainId = useParticleChainId();
  const particleAccounts = useParticleAccounts();
  const particleIsActive = useParticleIsActive();

  // Intersend states
  const intersendChainId = useIntersendChainId();
  const intersendAccounts = useIntersendAccounts();
  const intersendIsActive = useIntersendIsActive();

  // Attempt eager connections on load
  useEffect(() => {
    // Particle
    particleAuth.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to Particle');
    });

    // Intersend
    intersendAuth.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to Intersend');
    });
  }, []);

  // Connect with Particle
  const connectParticle = async (type: AuthType) => {
    await particleAuth.activate({ preferredAuthType: type });
    console.log('Particle connected:', particleAccounts);
  };

  // Connect with Intersend
  const connectIntersend = async () => {
    await intersendAuth.activate();
    console.log('Intersend connected:', intersendAccounts);
  };

  // Disconnect
  const disconnectParticle = () => {
    particleAuth.deactivate().catch((e) => console.log('Disconnect Particle error', e));
  };
  const disconnectIntersend = () => {
    intersendAuth.deactivate().catch((e) => console.log('Disconnect Intersend error', e));
  };

  return (
    <div className="App">
      <h3>Particle Connector</h3>
      <div>{`Particle chainId: ${particleChainId}`}</div>
      <div>{`Particle accounts: ${particleAccounts}`}</div>
      <div>{`Particle isActive: ${particleIsActive}`}</div>
      {particleIsActive ? (
        <button onClick={disconnectParticle}>Disconnect Particle</button>
      ) : (
        <>
          <button onClick={() => connectParticle('google')}>Connect Particle with Google</button>
          <button onClick={() => connectParticle('twitter')}>Connect Particle with Twitter</button>
        </>
      )}

      <hr />

      <h3>Intersend Connector</h3>
      <div>{`Intersend chainId: ${intersendChainId}`}</div>
      <div>{`Intersend accounts: ${intersendAccounts}`}</div>
      <div>{`Intersend isActive: ${intersendIsActive}`}</div>
      {intersendIsActive && 
        <button onClick={disconnectIntersend}>Disconnect Intersend</button>
      }
    </div>
  );
}

export default App;
