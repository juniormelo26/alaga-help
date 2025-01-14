'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card'
import { createFloodingNotificationSchema } from '../schema'

import { toast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import useDebounce from '@/hooks/use-debounce'
import { searchAddress, searchCoordinates } from '../actions'
import { parse, format } from 'date-fns';

import { LatLngTuple } from 'leaflet'
import { MapForm } from '@/app/app/flooding-notification/_components/map-form'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ufBrasil } from '@/data/data'
import { Alert } from './alert'
import { createNotification } from '@/config/api'

type Props = {
    openForm: (open: boolean) => void
}

const NotificationForm = ({ openForm }: Props) => {

    type createFloodingNotificationObject = z.infer<typeof createFloodingNotificationSchema>

    const { handleSubmit, register, formState: { errors, isSubmitting, isLoading }, control, setValue, getValues, setError } = useForm<createFloodingNotificationObject>({
        resolver: zodResolver(createFloodingNotificationSchema),
        defaultValues: {
            date: format(new Date(), 'dd/MM/yyyy'),
        },
    })

    const handleSubmitForm = async (data: createFloodingNotificationObject) => {
        try {
            const formattedDate = parse(data.date, 'dd/MM/yyyy', new Date());
            
            const dateForDatabase = format(formattedDate, 'yyyy-MM-dd');

            if (!data.latitude || !data.longitude) {
                setIsAlertOpen(true);
            }
            const payload = {
                ...data,
                date: dateForDatabase,
            };

            let response = await createNotification(payload)
            if(response.status === 201) {
                toast({
                    title: 'Sucesso',
                    description: 'Sua notificação foi salva com sucesso.',
                })
                openForm(false)
            }
        } catch (error) {
            toast({
                title: 'Erro!',
                description: 'Ocorreu um erro, tente novamente!'
            })
        }
    }


    // MAPS AND ADDRESS
    const [position, setPosition] = useState<LatLngTuple>([-26.830171106617026, -48.69609627289628]);
    const [cepInput, setCepInput] = useState('');
    const [addressNumberInput, setAddressNumberInput] = useState('');
    const debouncedCep = useDebounce(cepInput, 500);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [disbledSubmit, setDisbledSubmit] = useState(false)

    const setNewCoordinates = (coordinates: any) => {
        setPosition([coordinates.latitude, coordinates.longitude]);
        setValue('latitude', coordinates.latitude)
        setValue('longitude', coordinates.longitude)
        
        if (coordinates.limits.length > 0) {
            setValue('limitLatStart', parseFloat(coordinates.limits[0]))
            setValue('limitLonStart', parseFloat(coordinates.limits[2]))
            setValue('limitLatEnd', parseFloat(coordinates.limits[1]))
            setValue('limitLonEnd', parseFloat(coordinates.limits[3]))
        } else {
            setValue('limitLatStart', '')
            setValue('limitLonStart', '')
            setValue('limitLatEnd', '')
            setValue('limitLonEnd', '')
        }
    };

    const buildDataAddressUrl = (addressData: any, includeDistrict: boolean) => {
        if (!addressData || !addressData.logradouro || !addressData.localidade || !addressData.uf) {
            throw new Error("Dados insuficientes para montar a URL.");
        }

        const street = includeDistrict && addressData.bairro
            ? `${addressData.logradouro}, ${addressData.bairro}`
            : addressData.logradouro;

        let params = new URLSearchParams({
            format: "json",
            country: "Brazil",
            state: addressData.uf,
            city: addressData.localidade,
            street,
        });

        return params.toString()
    };

    const tryFetchCoordinates = async (addressData: any): Promise<any | null> => {
        const attempts = [
            buildDataAddressUrl(addressData, true),  // Com bairro
            buildDataAddressUrl(addressData, false) // Sem bairro
        ];

        for (let i = 0; i < attempts.length; i++) {
            const url = attempts[i];
            const coordinates = await searchCoordinates(url);
            if (coordinates) {
                let positions = {
                    latitude: parseFloat(coordinates.lat),
                    longitude: parseFloat(coordinates.lon),
                    limits: coordinates.boundingbox
                }
                return positions;
            } else if (i === attempts.length - 1) {
                setcoordinateNotFound()
            }
        }
        return null;
    };

    useEffect(() => {
        const fetchAddress = async () => {
            if (debouncedCep.length === 8) {
                try {
                    setDisbledSubmit(true)
                    const newAddress = await searchAddress(debouncedCep);
                    setValue('street', newAddress.logradouro || '');
                    setValue('district', newAddress.bairro || '');
                    setValue('complement', newAddress.complemento || '');
                    setValue('city', newAddress.localidade || '');
                    setValue('state', newAddress.uf || '');

                    if (newAddress) {
                        const coordinates = await tryFetchCoordinates(newAddress);
                        if (coordinates) {
                            setNewCoordinates(coordinates);
                            setDisbledSubmit(false)
                        }
                    }
                } catch (err) {
                    console.error('Erro ao buscar o endereço:', err);
                    setDisbledSubmit(false)
                }
            }
        };

        fetchAddress();
    }, [debouncedCep, setValue]);

    const setcoordinateNotFound = () => {
        setValue('limitLatStart', '')
        setValue('limitLonStart', '')
        setValue('limitLatEnd', '')
        setValue('limitLonEnd', '')
        setIsAlertOpen(true)
        setDisbledSubmit(false)
        setError("latitude", {
            type: "manual",
            message: "Campo obrigatório! Selecione o ponto no mapa!"
        });
        setError("longitude", {
            type: "manual",
            message: "Campo obrigatório! Selecione o ponto no mapa!"
        });
    };

    return (
        <div className='w-full h-full flex justify-center'>

            <Alert open={isAlertOpen} setOpen={setIsAlertOpen} needButton={true} title={'Não achamos o local no mapa'} message={'Por favor mova o ponteiro do mapa para o local do alagamento para registrar as coordenadas! Você pode usar o zoom para buscar o local com mais precisão.'} />
            <Alert open={disbledSubmit} setOpen={setIsAlertOpen} needButton={false} title={'Procurando Endereço'} message={'Aguarde enquanto localizamos os dados do enfereço.'} />

            <Card className="w-full">
                <CardHeader>
                    <CardDescription>Digite seu cep para buscar o endereço automáticamente.</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(handleSubmitForm)} >
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>

                            <div className="grid w-full items-center gap-4">

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Data</Label>
                                        <Input
                                            readOnly
                                            {...register('date')}
                                        />
                                        {errors.date &&
                                            <p className='text-red-400'>{errors.date.message as string}</p>
                                        }
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="zipcode">CEP</Label>
                                        <Input
                                            {...register('zipcode', { valueAsNumber: true })}
                                            onChange={(e) => setCepInput(e.target.value.replace(/\D/g, ''))}
                                            value={cepInput}
                                            placeholder="Digite seu CEP"
                                        />
                                        {errors.zipcode &&
                                            <p className='text-red-400 text-sm'>{errors.zipcode.message as string}</p>
                                        }
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
                                    <div className='lg:col-span-5'>
                                        <div className="flex flex-col space-y-1.5">
                                            <Label htmlFor="name">Rua*</Label>
                                            <Input
                                                {...register('street')}
                                            />
                                            {errors.street &&
                                                <p className='text-red-400 text-sm'>{errors.street.message as string}</p>
                                            }
                                        </div>

                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Número</Label>
                                        <Input
                                            {...register('addressNumber', { valueAsNumber: true })}
                                            onChange={(e) => setAddressNumberInput(e.target.value.replace(/\D/g, ''))}
                                            value={addressNumberInput}
                                        />
                                        {errors.addressNumber &&
                                            <p className='text-red-400'>{errors.addressNumber.message as string}</p>
                                        }
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Bairro*</Label>
                                        <Input
                                            {...register('district')}
                                        />
                                        {errors.district &&
                                            <p className='text-red-400'>{errors.district.message as string}</p>
                                        }
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Cidade*</Label>
                                        <Input
                                            {...register('city')}
                                        />
                                        {errors.city &&
                                            <p className='text-red-400'>{errors.city.message as string}</p>
                                        }
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Estado*</Label>
                                        <Controller
                                            control={control}
                                            name={'state'}
                                            render={({ field }) => (

                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select o estado" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Estados</SelectLabel>
                                                            {ufBrasil.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />

                                        {errors.state &&
                                            <p className='text-red-400'>{errors.state.message as string}</p>
                                        }
                                    </div>
                                    <div className="flex flex-col space-y-1.5">

                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="name">Complemento</Label>
                                    <Input
                                        {...register('complement')}
                                    />
                                    {errors.complement &&
                                        <p className='text-red-400'>{errors.complement.message as string}</p>
                                    }
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="name">Observações</Label>
                                    <Input
                                        {...register('observation')}
                                    />
                                    {errors.observation &&
                                        <p className='text-red-400'>{errors.observation.message as string}</p>
                                    }
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Latitude*</Label>
                                        <Input
                                            readOnly
                                            {...register('latitude')}
                                        />
                                        {errors.latitude &&
                                            <p className='text-red-400'>{errors.latitude.message as string}</p>
                                        }
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Longitude*</Label>
                                        <Input
                                            readOnly
                                            {...register('longitude')}
                                        />
                                        {errors.longitude &&
                                            <p className='text-red-400'>{errors.longitude.message as string}</p>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="grid bg-red-600 h-[400px] md:h-full">
                                <MapForm position={position} setCoordinates={setNewCoordinates} />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-4">
                            <Button
                                variant="destructive"
                                disabled={isLoading}
                                type="button"
                                onClick={() => openForm(false)}
                            >
                                {!isSubmitting && 'Cancelar'}
                            </Button>
                            <Button disabled={isLoading || disbledSubmit} type="submit">
                                {isSubmitting && 'Salvando...'}
                                {!isSubmitting && 'Salvar'}
                            </Button>

                        </div>
                    </form>
                </CardContent>
            </Card>

        </div>
    );
};
export default NotificationForm;