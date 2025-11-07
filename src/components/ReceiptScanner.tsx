import { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface ReceiptScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAmountDetected: (amount: number) => void;
}

export const ReceiptScanner = ({ open, onOpenChange, onAmountDetected }: ReceiptScannerProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [detectedAmount, setDetectedAmount] = useState<number | null>(null);
  const [editableAmount, setEditableAmount] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      processOCR(base64);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async (imageBase64: string) => {
    setIsProcessing(true);
    setExtractedText("");
    setDetectedAmount(null);
    setEditableAmount("");

    try {
      const { data, error } = await supabase.functions.invoke("ocr-receipt", {
        body: { imageBase64 },
      });

      if (error) throw error;

      if (data.success) {
        setExtractedText(data.extractedText);
        if (data.detectedAmount) {
          setDetectedAmount(data.detectedAmount);
          setEditableAmount(data.detectedAmount.toString());
          toast.success("Berhasil membaca struk!");
        } else {
          toast.warning("Tidak dapat menemukan nominal. Silakan input manual.");
        }
      } else {
        throw new Error(data.error || "OCR gagal");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Gagal membaca struk. Silakan coba lagi atau input manual.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseAmount = () => {
    const amount = parseFloat(editableAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Nominal tidak valid");
      return;
    }
    onAmountDetected(amount);
    handleClose();
  };

  const handleClose = () => {
    setSelectedImage(null);
    setExtractedText("");
    setDetectedAmount(null);
    setEditableAmount("");
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Struk</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 flex flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>Ambil Foto</span>
              </Button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full h-24 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8" />
                <span>Pilih dari Galeri</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Receipt preview"
                  className="w-full rounded-lg border max-h-64 object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Memproses struk...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Result */}
              {extractedText && !isProcessing && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Teks Terbaca</Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg text-xs max-h-32 overflow-y-auto">
                      {extractedText}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amount">Total Terbaca</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editableAmount}
                      onChange={(e) => setEditableAmount(e.target.value)}
                      placeholder="Input manual jika tidak terdeteksi"
                      className="mt-1"
                    />
                    {detectedAmount && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Terdeteksi: {formatCurrency(detectedAmount)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Coba Lagi
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUseAmount}
                      disabled={!editableAmount}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Gunakan
                    </Button>
                  </div>
                </div>
              )}

              {!extractedText && !isProcessing && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Tidak bisa membaca total dari struk. Silakan input manual.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setEditableAmount("");
                      setExtractedText("manual");
                    }}
                  >
                    Input Manual
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
