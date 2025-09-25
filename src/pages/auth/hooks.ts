import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { loginSchema } from "./schema";
import api from "@/lib/api";
import { toast } from "sonner";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (body: z.infer<typeof loginSchema>) => {
      return api.post("/auth/login", { body });
    },
    onSuccess: (data) => {
      console.log("Login successful!", data);
      // Invalidate auth status without waiting
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      console.log("Auth queries invalidated");
      // Navigate immediately
      console.log("Attempting navigation to /");
      navigate("/", { replace: true });
      console.log("Navigation call completed");
    },
    onError: (err) => {
      toast.error(err?.message || "Unknown error");
    },
  });
};
