import { useMemo, useState } from 'react';
import ConferenceJoin from '@/components/ConferenceJoin';
import JitsiStage from '@/components/JitsiStage';
import { useSearchParams } from 'react-router-dom';

export default function ConferencePage() {
  const [sp] = useSearchParams();
  const room = useMemo(
    () => (sp.get('room') || 'zinha-sala-general').trim(),
    [sp]
  );

  const [stage, setStage] = useState<null | { displayName: string; isModerator: boolean }>(null);

  if (!stage) {
    return (
      <ConferenceJoin
        room={room}
        onContinue={(s) => setStage(s)}
      />
    );
  }

  return (
    <JitsiStage
      room={room}
      displayName={stage.displayName}
      isModerator={stage.isModerator}
    />
  );
}
