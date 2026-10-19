import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Checkbox({ className, checked, defaultChecked, onCheckedChange, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const current = checked ?? internal;
  return <CheckboxPrimitive.Root {...props} checked={current} onCheckedChange={next => { setInternal(next); onCheckedChange?.(next); }} className={cn('declic-checkbox', className)}>
    <CheckboxPrimitive.Indicator className="declic-checkbox-indicator">{current === 'indeterminate' ? <Minus/> : <Check/>}</CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>;
}
