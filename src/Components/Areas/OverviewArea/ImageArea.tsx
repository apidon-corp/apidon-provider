import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useUploadImage from "@/hooks/personalizationHooks/useUploadImage";
import { Button, Flex, Icon, Image, SkeletonCircle } from "@chakra-ui/react";
import { ChangeEvent, useRef, useState } from "react";
import { FaRegUserCircle } from "react-icons/fa";
import { useRecoilState } from "recoil";

export default function ImageArea() {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [candicatedImage, setCandicateImage] = useState("");

  const [newlySettedImage, setNewlySettedImage] = useState("");

  const { handleUploadImage } = useUploadImage();
  const [saveImageButtonLoading, setSaveImageButtonLoading] = useState(false);

  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  const handleUploadImageButton = () => {
    if (imageInputRef.current) imageInputRef.current.click();
  };

  const onInputImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      console.log(
        "No Files Provided to onSelectWillBeCropped \n aborting....."
      );
      return;
    }

    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (readerEvent) => {
      setCandicateImage(readerEvent.target?.result as string);
    };
  };

  const handleCancelButton = () => {
    setCandicateImage("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSaveButton = async () => {
    setSaveImageButtonLoading(true);

    const operationResult = await handleUploadImage(candicatedImage);

    if (operationResult) {
      setCurrentUserState((prev) => ({ ...prev, image: operationResult }));
      setNewlySettedImage(candicatedImage);
      setCandicateImage("");
      if (imageInputRef.current) imageInputRef.current.value = "";
    }

    setSaveImageButtonLoading(false);
  };

  return (
    <Flex
      id="image-area"
      justify="center"
      align="center"
      direction="column"
      position="relative"
    >
      <Image
        src={
          candicatedImage
            ? candicatedImage
            : newlySettedImage
            ? newlySettedImage
            : currentUserState.image
        }
        fallback={
          <>
            {candicatedImage || currentUserState.image || newlySettedImage ? (
              <SkeletonCircle width="20vh" height="20vh" />
            ) : (
              <Icon as={FaRegUserCircle} width="20vh" height="20vh" />
            )}
          </>
        }
        rounded="full"
        width="20vh"
        height="20vh"
      />
      {candicatedImage ? (
        <Flex position="absolute" bottom="-10" gap="1">
          <Button
            variant="solid"
            colorScheme="blue"
            size="sm"
            rounded="full"
            isLoading={saveImageButtonLoading}
            onClick={handleSaveButton}
          >
            Save
          </Button>
          <Button
            variant="outline"
            colorScheme="blue"
            size="sm"
            rounded="full"
            onClick={handleCancelButton}
            isDisabled={saveImageButtonLoading}
          >
            Cancel
          </Button>
        </Flex>
      ) : (
        <Button
          variant={currentUserState.image ? "outline" : "solid"}
          colorScheme="blue"
          size="sm"
          rounded="full"
          onClick={handleUploadImageButton}
          position="absolute"
          bottom="-10"
        >
          {currentUserState.image ? "New Image" : "Set Image"}
        </Button>
      )}

      <input
        type="file"
        ref={imageInputRef}
        onChange={onInputImageChange}
        accept="image/*"
        hidden
      />
    </Flex>
  );
}
