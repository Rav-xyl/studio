
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';
import { useRef } from 'react';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: FileList | null, isAudit?: boolean) => void;
  isAudit?: boolean;
}

export function BulkUploadDialog({ open, onOpenChange, onUpload, isAudit = false }: BulkUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onUpload(fileInputRef.current?.files || null, isAudit);
    onOpenChange(false);
  }

  const title = isAudit ? "System Audit: Upload Resumes" : "Bulk Resume Upload";
  const description = isAudit 
    ? "Upload resumes to be used as test data for the full system audit." 
    : "Upload multiple resumes at once. The AI will screen them and add them to the pipeline.";
  const buttonText = isAudit ? "Start Audit" : "Upload & Add to Pool";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="resumes">Resumes (PDF, DOCX)</Label>
            <div className='flex items-center justify-center w-full'>
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 border-border">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX, etc. (MAX. 5MB each)</p>
                  </div>
                  <Input id="dropzone-file" ref={fileInputRef} type="file" className="hidden" multiple />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{buttonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    