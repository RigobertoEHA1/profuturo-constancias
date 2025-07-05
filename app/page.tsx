"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.location.href = 'https://school.profuturo.education';
  }, []);
  return null;
}
