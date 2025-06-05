import { useEffect, useRef, useState, useCallback } from "react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";

interface UseDirtyFormOptions<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>;
  initialData?: T;
  onBeforeUnload?: () => boolean;
}

export function useDirtyForm<T extends FieldValues = FieldValues>({ form, initialData, onBeforeUnload }: UseDirtyFormOptions<T>) {
  const [isDirty, setIsDirty] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const initialDataRef = useRef(initialData);
  const router = useRouter();

  // Update initial data ref when it changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Check if form is dirty by comparing current values with initial data
  const checkDirty = useCallback(() => {
    const currentValues = form.getValues();
    const initial = initialDataRef.current;
    if (!initial) {
      // If no initial data, check if any field has been filled
      const hasValues = Object.values(currentValues as Record<string, unknown>).some((value) => {
        if (typeof value === "string") return value.trim() !== "";
        if (typeof value === "number") return value !== 0;
        if (typeof value === "boolean") return value !== false;
        if (Array.isArray(value)) return value.length > 0;
        return value != null;
      });
      setIsDirty(hasValues && !hasSubmitted);
      return hasValues && !hasSubmitted;
    }

    // For editing mode, compare with initial data but ignore some fields that change automatically
    const cleanCurrentValues = { ...currentValues };
    const cleanInitialValues = { ...initial };

    // Remove fields that shouldn't trigger dirty state
    delete (cleanCurrentValues as Record<string, unknown>).id;
    delete (cleanInitialValues as Record<string, unknown>).id;

    // Deep comparison of current values with initial data
    const isDirtyForm = JSON.stringify(cleanCurrentValues) !== JSON.stringify(cleanInitialValues);
    const finalIsDirty = isDirtyForm && !hasSubmitted;
    setIsDirty(finalIsDirty);
    return finalIsDirty;
  }, [form, hasSubmitted]);

  // Watch for form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      checkDirty();
    });

    return () => subscription.unsubscribe();
  }, [form, checkDirty]);

  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !hasSubmitted) {
        // Call custom handler if provided
        if (onBeforeUnload && !onBeforeUnload()) {
          return;
        }

        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Deseja realmente sair?";
        return "Você tem alterações não salvas. Deseja realmente sair?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, hasSubmitted, onBeforeUnload]);
  // Block navigation with Next.js router and link clicks
  useEffect(() => {
    if (typeof window === "undefined") return;    // Intercept all link clicks
    const handleLinkClick = (e: MouseEvent) => {
      console.log('Link click detected, isDirty:', isDirty, 'hasSubmitted:', hasSubmitted);
      if (!isDirty || hasSubmitted)
        return;
      const target = e.target as HTMLElement;
      // Check for both direct links and buttons inside links
      const link = target.closest('a[href]') as HTMLAnchorElement;
      const buttonInsideLink = target.closest('button')?.closest('a[href]') as HTMLAnchorElement;

      const actualLink = link || buttonInsideLink;

      console.log('Found link:', actualLink?.href, 'Current URL:', window.location.href);
      if (actualLink && actualLink.href) {
        // Check if it's an internal navigation (same origin or relative path)
        try {
          const linkUrl = new URL(link.href, window.location.origin);
          const currentUrl = new URL(window.location.href);

          // Check if it's a different page (different pathname or search params)
          const isDifferentPage = linkUrl.pathname !== currentUrl.pathname ||
            linkUrl.search !== currentUrl.search;

          if (linkUrl.origin === currentUrl.origin && isDifferentPage) {
            console.log('Intercepting navigation to:', link.href);
            e.preventDefault();
            e.stopPropagation();

            setPendingNavigation(() => () => {
              router.push(linkUrl.pathname + linkUrl.search);
            });
            setShowDialog(true);
          }
        } catch {
          // Invalid URL, ignore
        }
      }
    };

    // Listen for back/forward button
    const handlePopState = (e: PopStateEvent) => {
      if (isDirty && !hasSubmitted) {
        e.preventDefault();
        setPendingNavigation(() => () => window.history.back());
        setShowDialog(true);
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Add event listeners
    document.addEventListener("click", handleLinkClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty, hasSubmitted, router]);

  const handleConfirmNavigation = useCallback(() => {
    setShowDialog(false);
    setHasSubmitted(true);
    setIsDirty(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  const handleCancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const markAsSubmitted = useCallback(() => {
    setHasSubmitted(true);
    setIsDirty(false);
  }, []);

  const resetDirtyState = useCallback(() => {
    setHasSubmitted(false);
    setIsDirty(false);
  }, []);

  const markImageRemoved = useCallback(() => {
    // Mark form as dirty when an image is removed
    setIsDirty(true);
  }, []);

  return {
    isDirty,
    hasSubmitted,
    showDialog,
    markAsSubmitted,
    resetDirtyState,
    checkDirty,
    markImageRemoved,
    handleConfirmNavigation,
    handleCancelNavigation,
  };
}
