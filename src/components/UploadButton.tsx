"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

import { trpc } from "@/app/_trpc/client";
import { useUploadThing } from "@/lib/uploadthing";
import { Cloud, File, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Dropzone from "react-dropzone";
import { Progress } from "./ui/progress";
import { useToast } from "./ui/use-toast";

interface UploadDropzoneProps {
  isSubscribed: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const UploadDropzone = ({ isSubscribed, setIsOpen }: UploadDropzoneProps) => {
  const router = useRouter();

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanUploader" : "freePlanUploader"
  );

  const { mutate: startPolling } = trpc.getFile.useMutation({
    onSuccess: (file) => {
      router.push(`/dashboard/${file.id}`);
    },
    retry: true,
    retryDelay: 500,
  });

  //function for simulated progress
  const startSimulatedProgress = () => {
    //setting the upload progress to 0
    setUploadProgress(0);

    //defining the interval
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 95) {
          clearInterval(interval);
          return prevProgress;
        }

        return prevProgress + 5;
      });
    }, 500);

    return interval;
  };

  return (
    <Dropzone
      multiple={false}
      noClick={true}
      noKeyboard={true}
      disabled={isUploading}
      onDrop={async (acceptedFile) => {
        //setting the loading to true
        setIsUploading(true);

        //progress interval
        const progressInterval = startSimulatedProgress();

        //handle the file uploading
        const res = await startUpload(acceptedFile);

        //if there is no response from the server
        if (!res) {
          setIsOpen(false);
          return toast({
            title: "File size exceeds limit",
            description: `Please upload a file with size up to ${
              isSubscribed ? "16" : "4"
            }MB.`,
            variant: "destructive",
          });
        }

        //getting the first element from the response
        const [fileResponse] = res;

        //getting the key of the element
        const key = fileResponse?.key;

        //if the key is not present
        if (!key) {
          setIsOpen(false);
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }

        //after the file uploading is done
        clearInterval(progressInterval);

        //setting the uploading process to 100
        setUploadProgress(100);

        //start the polling
        startPolling({ key });
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          className="border h-64 m-4 border-dashed border-gray-300 rounded-lg"
          {...getRootProps()}
        >
          <div className="flex items-center justify-center h-full w-full">
            <label
              className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              htmlFor="dropzone-file"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                <p className="mb-2 text-sm text-zinc-700">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>

                <p className="text-xs text-zinc-500">
                  PDF (upto {isSubscribed ? "16" : "4"}MB)
                </p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                  <div className="px-3 py-2 h-full grid place-items-center">
                    <File className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="px-3 py-2 h-full text-sm truncate">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="w-full mt-4 max-w-xs mx-auto">
                  <Progress
                    indicatorColor={
                      uploadProgress === 100 ? "bg-green-500" : ""
                    }
                    value={uploadProgress}
                    className="h-1 w-full bg-zinc-200"
                  />

                  {uploadProgress === 100 ? (
                    <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 text-center pt-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Redirecting...
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                {...getInputProps()}
                type="file"
                id="dropzone-file"
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </Dropzone>
  );
};

const UploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button>Upload PDF</Button>
      </DialogTrigger>

      <DialogContent>
        <UploadDropzone isSubscribed={isSubscribed} setIsOpen={setIsOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;