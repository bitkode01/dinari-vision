import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Check, Loader2, SwitchCamera } from "lucide-react";
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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait a bit for video element to be ready
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          // Ensure video plays
          videoRef.current.play().catch(err => {
            console.error("Error playing video:", err);
          });
        }
      }, 100);
      
      toast.success("Kamera aktif");
    } catch (error) {
      console.error("Camera error:", error);
      const errorMessage = error instanceof Error ? error.message : "Tidak dapat mengakses kamera";
      setCameraError(errorMessage + ". Silakan gunakan galeri.");
      toast.error("Akses kamera dibutuhkan untuk scan struk.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        stopCamera();
        processOCR(base64);
        toast.success("Gambar berhasil diambil");
      };
      reader.readAsDataURL(blob);
    }, "image/jpeg", 0.95);
  };

  // Handle file selection from gallery
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

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (showCamera && !stream) {
      startCamera();
    }
  }, [facingMode]);

  // Ensure video plays when stream is set
  useEffect(() => {
    if (videoRef.current && stream && showCamera) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream, showCamera]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopCamera();
    }
  }, [open]);

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
    stopCamera();
    setSelectedImage(null);
    setExtractedText("");
    setDetectedAmount(null);
    setEditableAmount("");
    setIsProcessing(false);
    setShowCamera(false);
    setCameraError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan Struk</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage && !showCamera ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="default"
                className="w-full h-24 flex flex-col gap-2"
                onClick={startCamera}
              >
                <Camera className="h-8 w-8" />
                <span>Buka Kamera</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6" />
                <span>Pilih dari Galeri</span>
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {cameraError && (
                <p className="text-sm text-center text-muted-foreground">{cameraError}</p>
              )}
            </div>
          ) : showCamera ? (
            <div className="space-y-4">
              {/* Camera Preview */}
              <div className="relative rounded-lg overflow-hidden bg-black" style={{ height: '400px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    console.log("Video metadata loaded");
                    if (videoRef.current) {
                      videoRef.current.play().catch(err => console.error("Play error:", err));
                    }
                  }}
                  onError={(e) => {
                    console.error("Video element error:", e);
                    toast.error("Error pada video preview");
                  }}
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
                {/* Guideline Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed rounded-lg w-4/5 h-3/4">
                    <div className="absolute top-2 left-2 right-2 text-center">
                      <p className="text-white text-sm bg-black/50 rounded px-2 py-1 inline-block">
                        Posisikan struk dalam kotak
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Loading indicator while stream connects */}
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-white" />
                      <p className="text-sm text-white">Memuat kamera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Controls */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={stopCamera}
                >
                  <X className="h-4 w-4 mr-2" />
                  Batalkan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={capturePhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Ambil Foto
                </Button>
              </div>
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
