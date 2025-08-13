import React, { useEffect, useRef } from 'react';

const JitsiMeetComponent = ({ roomName }) => {
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName || 'MaSalleVideoReact',
      width: '100%',
      height: 600,
      parentNode: jitsiContainerRef.current,
      interfaceConfigOverwrite: {
        DEFAULT_BACKGROUND: '#000000',
      },
      configOverwrite: {
        disableSimulcast: false,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    // Nettoyage à la fin
    return () => api.dispose();
  }, [roomName]);

  return <div ref={jitsiContainerRef} style={{ height: '600px', width: '100%' }} />;
};

export default JitsiMeetComponent;
