import * as React from "react";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { makeDomainFunction } from "remix-domains";
import { performMutation, Form } from "remix-forms";
import type { Service, Barber } from "~/types";
import { BookingCalendar } from "~/components/BookingCalendar";
import { Select } from "~/components/Select";
import { Input } from "~/components/Input";
import { Button } from "~/components/Button";
import { Error } from "~/components/Error";
import { contentful } from "~/utils/contentful.server";
import { createBooking } from "~/models/booking.server";

type LoaderData = {
  barbers: Pick<Barber, "name">[];
  services: Pick<Service, "name" | "price">[];
};

const bookingSchema = z.object({
  barber: z.string(),
  service: z.string(),
  dateString: z.string(),
  hour: z.string(),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email(),
  phone: z.string().regex(/[0-9]{9}/, { message: "Invalid phone number" }),
});

export const bookingMutation = makeDomainFunction(bookingSchema)(
  async (values) => await createBooking(values)
);

export async function action({ request }: ActionArgs) {
  const result = await performMutation({
    request,
    schema: bookingSchema,
    mutation: bookingMutation,
  });

  if (!result.success) return json(result, 400);

  return json({ ...result, ok: true });
}

export async function loader({ request }: LoaderArgs) {
  const {
    barbersCollection: { items: barbers },
    servicesCollection: { items: services },
  } = await contentful(`{
    barbersCollection {
      items {
        name
      }
    }
    servicesCollection {
      items {
        name
        price
      }
    }
  }`);

  return json<LoaderData>({
    barbers,
    services,
  });
}

export default function Booking() {
  const fetcher = useFetcher();
  const { barbers, services } = useLoaderData<LoaderData>();
  const reducedMotion = useReducedMotion();
  const [barber, setBarber] = React.useState(barbers[0].name);
  const successRef = React.useRef<HTMLHeadingElement>(null);

  const isSuccess = fetcher?.data?.ok;

  const duration = reducedMotion ? 0 : 0.5;
  const variants = {
    visible: {
      opacity: 1,
      scale: 1,
      display: "block",
    },
    hidden: {
      opacity: 0,
      scale: 0.7,
      display: "none",
    },
  };

  React.useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        successRef.current && successRef.current.focus();
      }, duration * 100);
    }
  }, [duration, isSuccess]);

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col items-center justify-center">
      <AnimatePresence>
        <motion.div
          key="bookingForm"
          initial={variants.hidden}
          animate={isSuccess ? "hidden" : "visible"}
          variants={variants}
          transition={{
            duration,
          }}
        >
          <Form
            schema={bookingSchema}
            fetcher={fetcher}
            errorComponent={Error}
            method="post"
            className="flex flex-col items-center gap-4"
          >
            {({ Field, Errors, register }) => (
              <>
                <fieldset className="grid w-3/4 grid-cols-1 md:grid-cols-2 md:gap-8">
                  <Field name="barber">
                    {({ Errors }) => (
                      <>
                        <Select
                          {...register("barber")}
                          options={barbers.map(({ name }) => name)}
                          onChange={(e) => setBarber(e.target.value)}
                          label="Barber"
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <Field name="service">
                    {({ Errors }) => (
                      <>
                        <Select
                          {...register("service")}
                          options={services.map(
                            ({ name, price }) => `${name} (${price}$)`
                          )}
                          label="Service"
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </fieldset>

                <BookingCalendar barber={barber} register={register} />
                <Field name="dateString">{({ Errors }) => <Errors />}</Field>
                <Field name="hour">{({ Errors }) => <Errors />}</Field>

                <fieldset className="grid w-4/5 grid-cols-1 rounded-lg bg-white/5 p-10 md:grid-cols-2 md:gap-8">
                  <Field name="firstName">
                    {({ Errors }) => (
                      <>
                        <Input label="First name" {...register("firstName")} />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <Field name="lastName">
                    {({ Errors }) => (
                      <>
                        <Input label="Last name" {...register("lastName")} />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <Field name="email">
                    {({ Errors }) => (
                      <>
                        <Input
                          label="Email"
                          type="email"
                          {...register("email")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                  <Field name="phone">
                    {({ Errors }) => (
                      <>
                        <Input
                          label="Phone"
                          type="tel"
                          {...register("phone")}
                        />
                        <Errors />
                      </>
                    )}
                  </Field>
                </fieldset>

                <Errors />
                <Button
                  className="my-4 px-16"
                  type="submit"
                  disabled={Boolean(fetcher.submission)}
                >
                  {fetcher.submission ? "Booking..." : "Book"}
                </Button>
              </>
            )}
          </Form>
        </motion.div>

        <motion.div
          key="successNotification"
          initial={variants.hidden}
          animate={isSuccess ? "visible" : "hidden"}
          variants={variants}
          transition={{
            duration,
          }}
          className="absolute flex -translate-y-32 flex-col items-center gap-4 text-center"
        >
          <h2 tabIndex={-1} ref={successRef} className="text-3xl font-bold">
            Booking successful
          </h2>
          <p className="text-base">Thank you for booking with us.</p>
          <Link
            to="."
            reloadDocument
            className="text-xl text-brand underline hover:text-brand/75 focus:text-brand/75"
          >
            Book another appointment
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
