import React, {useState} from 'react'
import {Header} from "../../../components";
import {ComboBoxComponent} from "@syncfusion/ej2-react-dropdowns";
import type {Route} from "./+types/create-trips";
import {comboBoxItems, selectItems} from "~/constants";
import {cn, formatKey} from "~/libs/utils";
import {LayerDirective, LayersDirective, MapsComponent} from "@syncfusion/ej2-react-maps";
import {world_map} from "~/constants/world_map";
import {ButtonComponent} from "@syncfusion/ej2-react-buttons";
import {account} from "~/appwrite/client";
import {useNavigate} from "react-router";


export const loader = async () => {
    const response = await fetch('https://restcountries.com/v3.1/independent?status=true');
    const data = await response.json();

    return data.map((country: any) => ({
        name: country.flag + country.name.common,
        coordinates: country.latlng,
        value: country.name.common,
        openStreetMap: country.maps?.openStreetMap,
    }))
}

const CreateTrips = ({ loaderData }: Route.ComponentProps) => {
    const countries = loaderData as Country[];
    const navigate = useNavigate()

    const [error, setError] = useState<string | null >(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<TripFormData>({
        country: countries[0]?.name || '',
        travelStyle: '',
        interest: '',
        budget:'',
        groupType: '',
        duration: 0,
    })


    const handleSubmit = async  (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        if (
            !formData.country ||
            !formData.travelStyle ||
            !formData.interest ||
            !formData.budget ||
            !formData.groupType
        ) {
            setError('Please provide values for all fields');
            setLoading(false);
            return;
        }

        if (formData.duration < 1 || formData.duration > 10 ) {
            setError('Duration must be between 1 and 10 days');
            setLoading(false);
            return;
        }

        const user = await account.get();
        if (!user.$id) {
            console.log('User not authenticated');
            setLoading(false);
            return;
        }
        
        try {
           const response = await fetch('/api/create-trip', {
                method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   country: formData.country,
                   numberOfDays: formData.duration,
                   travelStyle: formData.travelStyle,
                   interest: formData.interest,
                   budget: formData.budget,
                   groupType: formData.groupType,
                   userId: user.$id,
               })
           })
            const result: CreateTripResponse = await response.json();

           if (result?.id) navigate(`/trips/${result.id}`);
           else console.error('Failed to generate a trip')
        } catch (e) {
            console.log('Error generating trip', e);
        } finally {
            setLoading(false);
        }
    }

    const handleChange =  (key: keyof TripFormData, value: string | number) => {
        setFormData({ ...formData, [key]: value as any})
    }

    const countryData = countries.map((country: Country) => ({
        text: country.name,
        value: country.value,
    }))

    const mapData = [
        {
            country: formData.country,
            color: '#EA382E',
            coordinates: countries.find(( c: Country) => c.name === formData.country)?.coordinates
        }
    ]

    return (
        <main className='flex flex-col gap-10 pb-20 wrapper'>
            <Header title='Add a New Trip' description='View and edit AI-generated travel plans' />

            <section className='mt-2.5 wrapper-md'>
                <form className='trip-form' onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor='country'>
                            Country
                        </label>
                        <ComboBoxComponent
                            id='country'
                            dataSource={countryData}
                            placeholder='Select a country'
                            fields={{ text: 'text', value: 'value' }}
                            className='combo-box'
                            allowFiltering
                            filtering={(e) => {
                                const query = e.text.toLowerCase();

                                e.updateData(
                                    countries.filter((country) =>
                                        country.name.toLowerCase().includes(query)).map(((country) => ({
                                            text: country.name,
                                            value: country.value,
                                        })))
                                )
                            }}
                            change={(e: { value: string | undefined }) => {
                                if (e.value) {
                                    handleChange('country', e.value)
                                }
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor='Duration'>
                            Duration
                        </label>
                        <input
                            id='Duration'
                            name='Duration'
                            type='number'
                            placeholder='Enter a number of days'
                            className='form-input placeholder:text-gray-100'
                            onChange={(e) => handleChange('duration', Number(e.target.value))}

                        />
                    </div>

                    {selectItems.map((key) => (
                      <div key={key}>
                          <label htmlFor={key}>
                              {formatKey(key)}
                          </label>

                          <ComboBoxComponent
                            id={key}
                            dataSource={comboBoxItems[key].map((item) => ({
                                text: item,
                                value: item,
                            }))}
                            fields={{ text: 'text', value: 'value' }}
                            placeholder={`Select ${formatKey(key)}`}
                            className='combo-box'
                            change={(e: { value: string | undefined }) => {
                                if (e.value) {
                                    handleChange(key, e.value)
                                }
                            }}
                            allowFiltering
                            filtering={(e) => {
                                const query = e.text.toLowerCase();

                                e.updateData(
                                    comboBoxItems[key].filter((item) =>
                                        item.toLowerCase().includes(query)).map(((item) => ({
                                        text: item,
                                        value: item,
                                    })))
                                )
                            }}
                          />
                      </div>
                    ))}

                    <div>
                        <label htmlFor='location'>
                            Location on the world map
                        </label>
                        <MapsComponent>
                            <LayersDirective>
                                <LayerDirective
                                    shapeData={world_map}
                                    dataSource={mapData}
                                    shapePropertyPath='name'
                                    shapeDataPath='country'
                                    shapeSettings={{ colorValuePath: 'color', fill: '#e5e5e5'}}
                                />
                            </LayersDirective>
                        </MapsComponent>
                    </div>

                    <div  className='bg-gray-200 h-px w-full'/>

                    {error && (
                        <div className='error'>
                            <p>{error}</p>
                        </div>
                    )}
                    <footer className='px-6 w-full'>
                        <ButtonComponent type='submit' className='button-class !h-12 !w-full' disabled={loading}>
                            <img src={`/assets/icons/${loading ? 'loader.svg' : 'magic-star.svg'}`} alt='loader' className={cn('size-5', {'animate-spin': loading})} />
                            <span className='p-18-semibold text-white'>{loading ? 'Generating...' : 'Generate Trip'}</span>
                        </ButtonComponent>
                    </footer>
                </form>
            </section>
        </main>
    )
}
export default CreateTrips
