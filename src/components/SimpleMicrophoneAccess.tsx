interface SimpleMicrophoneAccessProps {
  onPermissionGranted: () => void;
  onNeedHelp: () => void;
}

export function SimpleMicrophoneAccess({
  onPermissionGranted,
  onNeedHelp
}: SimpleMicrophoneAccessProps) {
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      onPermissionGranted();
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
    }
  };

  return (
    <div className="p-6 bg-card rounded-xl shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-6 text-foreground">
        Microphone Access Required
      </h2>
      
      <p className="mb-8 text-muted-foreground">
        To use voice notes, we need permission to access your microphone.
        Click the button below to grant access.
      </p>

      <div className="space-y-4">
        <button
          onClick={requestPermission}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Allow Microphone Access
        </button>

        <button
          onClick={onNeedHelp}
          className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Need Help?
        </button>
      </div>
    </div>
  );
}
