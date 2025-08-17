
'use client';

import { useRef, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: FileList | null, companyType: 'startup' | 'enterprise') => void;
}

export function BulkUploadDialog({ open, onOpenChange, onUpload }: BulkUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyType, setCompanyType] = useState<'startup' | 'enterprise' | ''>('');

  const handleSubmit = () => {
    if (!companyType) {
      alert("Please select a company type."); // Simple validation
      return;
    }
    onUpload(fileInputRef.current?.files || null, companyType);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Resume Upload</DialogTitle>
          <DialogDescription>
            Select the company type to tailor the AI screening process.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="company-type">Company Type</Label>
            <Select onValueChange={(value) => setCompanyType(value as any)} value={companyType}>
              <SelectTrigger id="company-type">
                <SelectValue placeholder="Select context..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resumes">Resumes (.pdf, .doc, .docx)</Label>
            <div className='flex items-center justify-center w-full'>
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 border-border">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                      <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </div>
                  <Input id="dropzone-file" ref={fileInputRef} type="file" className="hidden" multiple accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!companyType}>Upload & Add to Pool</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
