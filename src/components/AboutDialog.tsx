import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>About Tracer</DialogTitle>
        <DialogDescription>
          Version 1.0.0
        </DialogDescription>
        <p>Tracer is a tool for tracking and visualizing data.</p>
        <p>Your data stays private—nothing is stored on servers or shared.</p>
        <p>Built with ❤️ by Aaron Beall:</p>
        <p className="flex gap-4">
          <a href="https://github.com/aaronbeall" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="black">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.793-.26.793-.577v-2.17c-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.997.108-.774.42-1.305.763-1.605-2.665-.305-5.467-1.333-5.467-5.93 0-1.31.468-2.38 1.236-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.987-.4 3.007-.405 1.02.005 2.047.138 3.007.405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.24 2.873.117 3.176.768.84 1.236 1.91 1.236 3.22 0 4.61-2.807 5.62-5.48 5.92.432.372.816 1.102.816 2.222v3.293c0 .32.192.694.8.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          {' | '}
          <a href="https://patreon.com/aaronbeall" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 1080 1080" fill="black">
              <path xmlns="http://www.w3.org/2000/svg" d="M1033.05,324.45c-0.19-137.9-107.59-250.92-233.6-291.7c-156.48-50.64-362.86-43.3-512.28,27.2  C106.07,145.41,49.18,332.61,47.06,519.31c-1.74,153.5,13.58,557.79,241.62,560.67c169.44,2.15,194.67-216.18,273.07-321.33  c55.78-74.81,127.6-95.94,216.01-117.82C929.71,603.22,1033.27,483.3,1033.05,324.45z"/>
            </svg>
            Patreon
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
