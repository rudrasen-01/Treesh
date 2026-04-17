import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProfilePictureUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: string) => Promise<boolean> | boolean;
  currentAvatar?: string;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

const getCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const outCanvas = document.createElement("canvas");
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) {
    throw new Error("Could not get output canvas context");
  }

  const outputSize = 512;
  outCanvas.width = outputSize;
  outCanvas.height = outputSize;
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";

  outCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return outCanvas.toDataURL("image/jpeg", 0.92);
};

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatar,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageSrc(result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImageSrc(result);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
  };

  const handleRotationChange = (value: number[]) => {
    setRotation(value[0]);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels || isSaving) return;

    setIsSaving(true);
    try {
      const croppedImageData = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );
      const saved = await onSave(croppedImageData);
      if (saved !== false) {
        handleClose();
      }
    } catch (error) {
      toast({
        title: "Failed to crop image",
        description: "Please try a different photo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleClose = () => {
    setImageSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setIsDragging(false);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          {!imageSrc && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Upload a photo</p>
              <p className="text-muted-foreground mb-4">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Supports JPEG, PNG, GIF • Max 10MB
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose Photo
              </Button>
              {currentAvatar && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Current photo will be replaced after save.
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Image Editor */}
          {imageSrc && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-4 h-4" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="w-24"
                  />
                  <ZoomIn className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  <Slider
                    value={[rotation]}
                    onValueChange={(value) => setRotation(value[0])}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {rotation}°
                  </span>
                </div>

                <Button variant="outline" onClick={handleReset} size="sm">
                  Reset
                </Button>
              </div>

              {/* Professional crop stage */}
              <div className="relative w-full max-w-[520px] h-[420px] mx-auto rounded-xl overflow-hidden bg-black/90 border border-border">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  objectFit="cover"
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                />
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Drag to reposition • Use zoom and rotate for best framing
              </p>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleClose}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Check className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Profile Picture"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
